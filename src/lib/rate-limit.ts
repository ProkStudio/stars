type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function prune() {
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (v.resetAt < now) buckets.delete(k);
  }
}

/**
 * In-memory rate limit (один процесс). В горизонтальном масштабе — Redis/Upstash.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterSec: number } {
  prune();
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.resetAt < now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  if (b.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true };
}
