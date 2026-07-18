import { createHash } from "node:crypto";
import { EXTERNAL_USAGE_LIMITS } from "./dreamConfig";

export type UsageDecision =
  | "allowed"
  | "user_limited"
  | "global_limited"
  | "duplicate"
  | "store_unavailable";

type ReserveInput = {
  identityHash: string;
  dreamHash: string;
  now?: Date;
};

type MemoryEntry = { count: number; expiresAt: number };

export interface ExternalUsageStore {
  reserve(input: ReserveInput): Promise<UsageDecision>;
}

function utcBuckets(now: Date) {
  const iso = now.toISOString();
  return {
    minute: iso.slice(0, 16),
    hour: iso.slice(0, 13),
    day: iso.slice(0, 10),
  };
}

function limiterKeys(input: ReserveInput) {
  const now = input.now ?? new Date();
  const bucket = utcBuckets(now);
  const prefix = "jamgyeol:external:v1";

  return {
    minute: `${prefix}:user:${input.identityHash}:minute:${bucket.minute}`,
    hour: `${prefix}:user:${input.identityHash}:hour:${bucket.hour}`,
    day: `${prefix}:user:${input.identityHash}:day:${bucket.day}`,
    globalDay: `${prefix}:global:day:${bucket.day}`,
    duplicate: `${prefix}:dream:${input.dreamHash}`,
  };
}

export class MemoryExternalUsageStore implements ExternalUsageStore {
  private counters = new Map<string, MemoryEntry>();
  private duplicates = new Map<string, number>();

  async reserve(input: ReserveInput): Promise<UsageDecision> {
    const now = (input.now ?? new Date()).getTime();
    const keys = limiterKeys(input);

    if (this.counters.size + this.duplicates.size > 1000) this.prune(now);

    const minute = this.readCounter(keys.minute, now);
    const hour = this.readCounter(keys.hour, now);
    const day = this.readCounter(keys.day, now);
    const globalDay = this.readCounter(keys.globalDay, now);

    if (
      minute >= EXTERNAL_USAGE_LIMITS.minute ||
      hour >= EXTERNAL_USAGE_LIMITS.hour ||
      day >= EXTERNAL_USAGE_LIMITS.day
    ) {
      return "user_limited";
    }
    if (globalDay >= EXTERNAL_USAGE_LIMITS.globalDay) return "global_limited";
    if ((this.duplicates.get(keys.duplicate) ?? 0) > now) return "duplicate";

    this.increment(keys.minute, now + 120_000, now);
    this.increment(keys.hour, now + 7_200_000, now);
    this.increment(keys.day, now + 172_800_000, now);
    this.increment(keys.globalDay, now + 172_800_000, now);
    this.duplicates.set(keys.duplicate, now + EXTERNAL_USAGE_LIMITS.duplicateSeconds * 1000);
    return "allowed";
  }

  private readCounter(key: string, now: number) {
    const entry = this.counters.get(key);
    if (!entry || entry.expiresAt <= now) {
      this.counters.delete(key);
      return 0;
    }
    return entry.count;
  }

  private increment(key: string, expiresAt: number, now: number) {
    const count = this.readCounter(key, now);
    this.counters.set(key, { count: count + 1, expiresAt });
  }

  private prune(now: number) {
    for (const [key, entry] of this.counters) {
      if (entry.expiresAt <= now) this.counters.delete(key);
    }
    for (const [key, expiresAt] of this.duplicates) {
      if (expiresAt <= now) this.duplicates.delete(key);
    }
  }
}

const RESERVE_SCRIPT = `
local minute = tonumber(redis.call('GET', KEYS[1]) or '0')
local hour = tonumber(redis.call('GET', KEYS[2]) or '0')
local day = tonumber(redis.call('GET', KEYS[3]) or '0')
local global_day = tonumber(redis.call('GET', KEYS[4]) or '0')

if minute >= tonumber(ARGV[1]) or hour >= tonumber(ARGV[2]) or day >= tonumber(ARGV[3]) then
  return 'user_limited'
end
if global_day >= tonumber(ARGV[4]) then
  return 'global_limited'
end
if redis.call('EXISTS', KEYS[5]) == 1 then
  return 'duplicate'
end

local minute_next = redis.call('INCR', KEYS[1])
if minute_next == 1 then redis.call('EXPIRE', KEYS[1], 120) end
local hour_next = redis.call('INCR', KEYS[2])
if hour_next == 1 then redis.call('EXPIRE', KEYS[2], 7200) end
local day_next = redis.call('INCR', KEYS[3])
if day_next == 1 then redis.call('EXPIRE', KEYS[3], 172800) end
local global_next = redis.call('INCR', KEYS[4])
if global_next == 1 then redis.call('EXPIRE', KEYS[4], 172800) end
redis.call('SET', KEYS[5], '1', 'EX', tonumber(ARGV[5]), 'NX')
return 'allowed'
`;

class UpstashExternalUsageStore implements ExternalUsageStore {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  async reserve(input: ReserveInput): Promise<UsageDecision> {
    const keys = limiterKeys(input);
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        "EVAL",
        RESERVE_SCRIPT,
        "5",
        keys.minute,
        keys.hour,
        keys.day,
        keys.globalDay,
        keys.duplicate,
        String(EXTERNAL_USAGE_LIMITS.minute),
        String(EXTERNAL_USAGE_LIMITS.hour),
        String(EXTERNAL_USAGE_LIMITS.day),
        String(EXTERNAL_USAGE_LIMITS.globalDay),
        String(EXTERNAL_USAGE_LIMITS.duplicateSeconds),
      ]),
      signal: AbortSignal.timeout(3_000),
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`Usage store request failed (${response.status})`);
    const data = (await response.json()) as { result?: unknown; error?: unknown };
    if (typeof data.result !== "string") throw new Error("Usage store returned an invalid result");
    if (
      data.result !== "allowed" &&
      data.result !== "user_limited" &&
      data.result !== "global_limited" &&
      data.result !== "duplicate"
    ) {
      throw new Error("Usage store returned an unknown decision");
    }
    return data.result;
  }
}

const memoryStore = new MemoryExternalUsageStore();

function usageStore(): ExternalUsageStore | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) return new UpstashExternalUsageStore(url.replace(/\/$/, ""), token);
  if (process.env.NODE_ENV !== "production") return memoryStore;
  return null;
}

export function hashPrivateValue(value: string) {
  const salt = process.env.RATE_LIMIT_HASH_SALT || "jamgyeol-local-development";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

export function trustedClientAddress(request: Request) {
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}

export async function reserveExternalAttempt(
  request: Request,
  dream: string
): Promise<UsageDecision> {
  const store = usageStore();
  if (!store) return "store_unavailable";

  try {
    return await store.reserve({
      identityHash: hashPrivateValue(trustedClientAddress(request)),
      dreamHash: hashPrivateValue(dream),
    });
  } catch (error) {
    const safeError = error as Error;
    console.error("External usage store failed", { name: safeError.name });
    return "store_unavailable";
  }
}
