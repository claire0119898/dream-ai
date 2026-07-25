function positiveInteger(names: string[], fallback: number, maximum: number) {
  const configured = names.map((name) => process.env[name]).find(Boolean) || "";
  const value = Number.parseInt(configured, 10);
  return Number.isFinite(value) && value > 0 ? Math.min(value, maximum) : fallback;
}

export const MIN_DREAM_LENGTH = 20;
export const MAX_DREAM_LENGTH = 1500;

export type DreamInterpretationMode = "ai-first" | "hybrid" | "dictionary-only";

function interpretationMode(): DreamInterpretationMode {
  const value = process.env.DREAM_INTERPRETATION_MODE?.trim().toLowerCase();
  return value === "hybrid" || value === "dictionary-only" ? value : "ai-first";
}

export const DREAM_INTERPRETATION_MODE = interpretationMode();
export const ENRICHMENT_TIMEOUT_MS = positiveInteger(
  ["DREAM_REQUEST_TIMEOUT_MS", "API_TIMEOUT_MS"],
  30_000,
  30_000
);
export const ENRICHMENT_MAX_OUTPUT_TOKENS = positiveInteger(
  ["DREAM_MAX_OUTPUT_TOKENS", "EXTERNAL_API_MAX_OUTPUT_TOKENS"],
  3000,
  4000
);
export const DREAM_CONTEXT_ENTRY_LIMIT = positiveInteger(
  ["DREAM_CONTEXT_ENTRY_LIMIT"],
  8,
  8
);
export const DEFAULT_DREAM_MODEL = "gpt-4o-mini";

export const EXTERNAL_USAGE_LIMITS = {
  minute: positiveInteger(["DREAM_RATE_LIMIT_PER_MINUTE", "MINUTE_USER_LIMIT"], 2, 10),
  hour: positiveInteger(["DREAM_RATE_LIMIT_PER_HOUR", "HOURLY_USER_LIMIT"], 5, 50),
  day: positiveInteger(["DREAM_RATE_LIMIT_PER_DAY", "DAILY_USER_LIMIT"], 10, 100),
  globalDay: positiveInteger(["DREAM_GLOBAL_DAILY_LIMIT", "DAILY_EXTERNAL_API_LIMIT"], 50, 10_000),
  duplicateSeconds: positiveInteger(["DREAM_CACHE_TTL_SECONDS"], 300, 3600),
} as const;
