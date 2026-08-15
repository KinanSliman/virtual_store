/**
 * Fixed-window rate limiter, held in memory.
 *
 * The public routes write to the database — a product click logs a view, and
 * checkout writes an order — so an unthrottled loop could bloat the tables and
 * skew the analytics. This keeps casual abuse out without adding a Redis.
 *
 * Scope: one process. On a serverless host each instance keeps its own
 * counters, so the effective limit is per-instance rather than global. That's
 * a deliberate trade for a portfolio deployment; a shared store would be the
 * next step if this needed to be exact.
 */

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

/** Stops the map growing without bound on a long-lived process. */
function evictExpired(now: number) {
  if (windows.size < 5000) return;
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): RateLimitResult {
  evictExpired(now);

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: allowed
      ? 0
      : Math.ceil((existing.resetAt - now) / 1000),
  };
}

/** Only for tests — the map is module state. */
export function resetRateLimits() {
  windows.clear();
}

/**
 * Best-effort client identity. Behind a proxy the socket address is the
 * proxy's, so the forwarded header comes first; it's spoofable, which is
 * acceptable for throttling but would not be for anything security-critical.
 */
export function clientKey(request: Request, bucket: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${bucket}:${ip}`;
}
