function positiveInteger(name: string, fallback: number, maximum: number) {
  const value = Number.parseInt(process.env[name] || "", 10);
  return Number.isFinite(value) && value > 0 ? Math.min(value, maximum) : fallback;
}

export const MIN_DREAM_LENGTH = 20;
export const MAX_DREAM_LENGTH = 1500;

export const ENRICHMENT_TIMEOUT_MS = positiveInteger("API_TIMEOUT_MS", 20_000, 30_000);
export const ENRICHMENT_MAX_OUTPUT_TOKENS = positiveInteger(
  "EXTERNAL_API_MAX_OUTPUT_TOKENS",
  600,
  1000
);
export const DEFAULT_DREAM_MODEL = "gpt-4o-mini";

export const EXTERNAL_USAGE_LIMITS = {
  minute: positiveInteger("MINUTE_USER_LIMIT", 2, 10),
  hour: positiveInteger("HOURLY_USER_LIMIT", 5, 50),
  day: positiveInteger("DAILY_USER_LIMIT", 10, 100),
  globalDay: positiveInteger("DAILY_EXTERNAL_API_LIMIT", 50, 10_000),
  duplicateSeconds: 300,
} as const;
