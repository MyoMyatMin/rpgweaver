export function isNonEmptyString(value: unknown, min = 1): value is string {
  return typeof value === "string" && value.trim().length >= min;
}

export function sanitizeText(input: string): string {
  return input.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

export function generateId(prefix = "id"): string {
  const random = Math.random().toString(36).slice(2, 8);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}_${random}`;
}

type RateBucket = { count: number; resetAt: number };
const rateMap = new Map<string, RateBucket>();

export function checkRateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const bucket = rateMap.get(key);
  if (!bucket || bucket.resetAt < now) {
    const fresh: RateBucket = { count: 1, resetAt: now + windowMs };
    rateMap.set(key, fresh);
    return { allowed: true, remaining: limit - 1, resetAt: fresh.resetAt };
  }
  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }
  bucket.count += 1;
  return {
    allowed: true,
    remaining: limit - bucket.count,
    resetAt: bucket.resetAt,
  };
}

export function safeJSON<T = unknown>(value: unknown): T | null {
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return null;
  }
}
