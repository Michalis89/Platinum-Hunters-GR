/**
 * Rate Limiting Public API
 *
 * Provides both in-memory (synchronous) and Upstash Redis (async) rate limiting.
 *
 * In-memory usage (for simple/test use cases):
 * ```typescript
 * const result = rateLimit(identifier, { limit: 10, windowMs: 60_000 });
 * ```
 *
 * Upstash usage (for production serverless):
 * ```typescript
 * const result = await rateLimit('loginIp', clientIp);
 * ```
 *
 * ENVIRONMENT VARIABLES REQUIRED (Upstash only):
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

// Re-export getClientIp for convenience
export { getClientIp } from './get-client-ip';

// Type-only re-export — no runtime import, avoids ESM issues
export type { LimiterName } from './upstash';

/**
 * Result returned by the rateLimit function.
 */
export type RateLimitResult = {
  /** Whether the request is allowed */
  success: boolean;
  /** Maximum requests allowed in the window */
  limit: number;
  /** Remaining requests in current window */
  remaining: number;
  /** Unix timestamp (ms) when the limit resets */
  reset: number;
};

/**
 * Legacy rate limit config type for backwards compatibility.
 * @deprecated Use named limiters instead
 */
export type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

// In-memory store for simple rate limiting
const _memStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Generate standard rate limit HTTP headers.
 *
 * Headers included:
 * - X-RateLimit-Limit: Maximum requests allowed
 * - X-RateLimit-Remaining: Requests remaining in current window
 * - X-RateLimit-Reset: Unix timestamp when limit resets
 * - Retry-After: Seconds until limit resets (only when rate limited)
 *
 * @param result - Rate limit result from rateLimit()
 * @returns Headers object ready for Response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
  };

  if (!result.success) {
    const retryAfterSec = Math.ceil((result.reset - Date.now()) / 1000);
    headers['Retry-After'] = String(Math.max(0, retryAfterSec));
  }

  return headers;
}

/**
 * Rate limit presets.
 *
 * @deprecated Use named limiters (e.g. rateLimit('loginIp', key)) instead
 */
export const RATE_LIMITS = {
  auth: { limit: 5, windowMs: 60_000 },
  login: { limit: 5, windowMs: 15 * 60_000 },
  register: { limit: 3, windowMs: 60 * 60_000 },
  api: { limit: 100, windowMs: 60_000 },
  strict: { limit: 10, windowMs: 60_000 },
} as const;

/**
 * In-memory rate limiting (synchronous).
 *
 * Suitable for single-instance environments, tests, and simple use cases.
 * Does NOT share state across serverless instances.
 */
export function rateLimit(id: string, config: RateLimitConfig): RateLimitResult;
/**
 * Upstash Redis rate limiting (async, production-ready).
 *
 * Shares state across all serverless instances via Redis.
 */
export function rateLimit(limiter: string, key: string): Promise<RateLimitResult>;
export function rateLimit(
  arg1: string,
  arg2: RateLimitConfig | string,
): RateLimitResult | Promise<RateLimitResult> {
  if (typeof arg2 === 'object') {
    // In-memory rate limiting
    const now = Date.now();
    const entry = _memStore.get(arg1);
    if (!entry || now >= entry.resetAt) {
      const resetAt = now + arg2.windowMs;
      _memStore.set(arg1, { count: 1, resetAt });
      return { success: true, remaining: arg2.limit - 1, limit: arg2.limit, reset: resetAt };
    }
    entry.count += 1;
    if (entry.count > arg2.limit) {
      return { success: false, remaining: 0, limit: arg2.limit, reset: entry.resetAt };
    }
    return {
      success: true,
      remaining: arg2.limit - entry.count,
      limit: arg2.limit,
      reset: entry.resetAt,
    };
  }

  // Upstash rate limiting — lazy import to avoid pulling ESM modules at module load time
  return (async () => {
    // Bypass rate limiting in development mode
    if (process.env.NODE_ENV === 'development') {
      const { getLimiterConfig } = await import('./upstash');
      const config = getLimiterConfig(arg1 as Parameters<typeof getLimiterConfig>[0]);
      return {
        success: true,
        limit: config.limit,
        remaining: config.limit,
        reset: Date.now() + config.windowSec * 1000,
      };
    }

    const { getNamedLimiter, getLimiterConfig } = await import('./upstash');
    const limiterName = arg1 as Parameters<typeof getLimiterConfig>[0];
    const rateLimiter = getNamedLimiter(limiterName);
    const config = getLimiterConfig(limiterName);
    const result = await rateLimiter.limit(arg2);

    return {
      success: result.success,
      limit: config.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  })();
}
