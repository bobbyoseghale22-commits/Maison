/**
 * In-process sliding-window rate limiter.
 *
 * Designed for a single-instance deployment (Render Web Service).
 * For multi-instance / edge deployments, replace the `store` Map with
 * a Redis-backed implementation using `@upstash/ratelimit` — the
 * public interface (`rateLimit`, `RateLimitResult`) stays identical.
 *
 * Architecture:
 *   • One Map<key, timestamps[]> per limiter config.
 *   • On each check: prune timestamps older than the window, push
 *     the current timestamp, compare length to the limit.
 *   • Periodic cleanup prevents unbounded Map growth (runs every
 *     `cleanupIntervalMs` if the last cleanup was long ago).
 *
 * Usage:
 *   const limiter = createRateLimiter({ limit: 10, windowMs: 60_000 });
 *   const result  = await limiter.check(request, "ip");
 *   if (!result.success) return rateLimitResponse(result);
 */

export interface RateLimitConfig {
  /** Maximum number of requests allowed within `windowMs`. */
  limit: number;
  /** Time window in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Unix timestamp (ms) when the current window resets. */
  resetAt: number;
}

// ---------------------------------------------------------------------------
// Key extraction helpers
// ---------------------------------------------------------------------------

/** Extracts a rate-limit key from a Request. Strategy options:
 *  - "ip"    → X-Forwarded-For or CF-Connecting-IP (proxy-aware)
 *  - "route" → strips query params and uses the pathname only
 *  - custom string → used verbatim (e.g. `user:${userId}`)
 */
export function extractKey(
  request: Request,
  strategy: "ip" | "route" | string,
  prefix = "",
): string {
  let raw: string;

  if (strategy === "ip") {
    const forwarded = request.headers.get("x-forwarded-for");
    const cf = request.headers.get("cf-connecting-ip");
    const real = request.headers.get("x-real-ip");
    // Take the first IP from X-Forwarded-For (closest to client through CDN)
    raw = (forwarded?.split(",")[0] ?? cf ?? real ?? "unknown").trim();
  } else if (strategy === "route") {
    const url = new URL(request.url);
    raw = url.pathname;
  } else {
    raw = strategy;
  }

  return prefix ? `${prefix}:${raw}` : raw;
}

// ---------------------------------------------------------------------------
// Limiter factory
// ---------------------------------------------------------------------------

type TimestampStore = Map<string, number[]>;

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // run cleanup at most every 5 min

export function createRateLimiter(config: RateLimitConfig) {
  const { limit, windowMs } = config;
  const store: TimestampStore = new Map();
  let lastCleanup = Date.now();

  function maybeCleanup(now: number) {
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
    lastCleanup = now;
    for (const [key, timestamps] of store.entries()) {
      const fresh = timestamps.filter((t) => now - t < windowMs);
      if (fresh.length === 0) {
        store.delete(key);
      } else {
        store.set(key, fresh);
      }
    }
  }

  return {
    /**
     * Checks and records a hit for `key`.
     * @param key  The rate-limit bucket identifier (e.g. an IP address).
     */
    check(key: string): RateLimitResult {
      const now = Date.now();
      maybeCleanup(now);

      const timestamps = store.get(key) ?? [];
      const fresh = timestamps.filter((t) => now - t < windowMs);
      fresh.push(now);
      store.set(key, fresh);

      const success = fresh.length <= limit;
      const remaining = Math.max(0, limit - fresh.length);
      const resetAt = fresh[0]! + windowMs;

      return { success, limit, remaining, resetAt };
    },

    /** Returns true if the key is currently over the limit (read-only). */
    isLimited(key: string): boolean {
      const now = Date.now();
      const timestamps = store.get(key) ?? [];
      return timestamps.filter((t) => now - t < windowMs).length >= limit;
    },
  };
}

// ---------------------------------------------------------------------------
// Pre-configured limiters for the routes that need them
// ---------------------------------------------------------------------------

/** Auth endpoints (login, register) — 10 attempts per 15 minutes per IP */
export const authLimiter = createRateLimiter({
  limit: 10,
  windowMs: 15 * 60 * 1000,
});

/** Checkout — 20 submissions per 10 minutes per IP */
export const checkoutLimiter = createRateLimiter({
  limit: 20,
  windowMs: 10 * 60 * 1000,
});

/** Cart writes — 60 per minute per IP (rapid add-to-cart is normal UX) */
export const cartLimiter = createRateLimiter({
  limit: 60,
  windowMs: 60 * 1000,
});

/** Review submissions — 5 per hour per IP */
export const reviewLimiter = createRateLimiter({
  limit: 5,
  windowMs: 60 * 60 * 1000,
});

/** Coupon validation — 30 per 10 minutes per IP */
export const couponLimiter = createRateLimiter({
  limit: 30,
  windowMs: 10 * 60 * 1000,
});

// ---------------------------------------------------------------------------
// Response helper
// ---------------------------------------------------------------------------

/**
 * Returns a 429 response with Retry-After and rate-limit headers.
 * Import this alongside the limiter and use it in route handlers:
 *
 *   const result = authLimiter.check(extractKey(request, "ip"));
 *   if (!result.success) return rateLimitResponse(result);
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  const retryAfterSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    },
  );
}
