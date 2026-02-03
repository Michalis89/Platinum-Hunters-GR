/**
 * Rate Limiting Public API
 *
 * Production-ready rate limiter backed by Upstash Redis.
 * Provides consistent rate limiting across all Vercel serverless instances.
 *
 * USAGE:
 * ======
 * ```typescript
 * import { rateLimit, rateLimitHeaders, getClientIp } from '@/lib/rate-limit';
 *
 * async function handler(req: Request) {
 *   const ip = getClientIp(req);
 *   const result = await rateLimit('loginIp', ip);
 *
 *   if (!result.success) {
 *     return new Response('Too Many Requests', {
 *       status: 429,
 *       headers: rateLimitHeaders(result),
 *     });
 *   }
 *
 *   // Process request...
 * }
 * ```
 *
 * AVAILABLE LIMITERS:
 * ===================
 * - loginIp: 10 requests per 10 minutes per IP
 * - loginEmail: 5 requests per 10 minutes per email
 * - forgotIp: 3 requests per hour per IP
 * - forgotEmail: 3 requests per hour per email
 * - registerIp: 5 requests per hour per IP
 * - apiGeneral: 100 requests per minute (general API)
 * - apiStrict: 10 requests per minute (expensive operations)
 *
 * ENVIRONMENT VARIABLES REQUIRED:
 * ===============================
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

import { getNamedLimiter, getLimiterConfig, type LimiterName } from './upstash';

// Re-export getClientIp for convenience
export { getClientIp } from './get-client-ip';

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
 * Check rate limit for a given identifier using a named limiter.
 *
 * @param limiter - Named limiter preset (e.g., 'loginIp', 'forgotEmail')
 * @param key - Unique identifier (e.g., IP address, email, user ID)
 * @returns Promise resolving to rate limit result
 *
 * @example
 * ```typescript
 * // Rate limit login attempts by IP
 * const result = await rateLimit('loginIp', clientIp);
 *
 * // Composite key for IP + email protection
 * const result = await rateLimit('loginEmail', `${clientIp}:${email}`);
 * ```
 */
export async function rateLimit(
  limiter: LimiterName,
  key: string
): Promise<RateLimitResult> {
  const rateLimiter = getNamedLimiter(limiter);
  const config = getLimiterConfig(limiter);

  const result = await rateLimiter.limit(key);

  return {
    success: result.success,
    limit: config.limit,
    remaining: result.remaining,
    // Upstash returns reset as Unix timestamp in milliseconds
    reset: result.reset,
  };
}

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

  // Add Retry-After header when rate limited
  if (!result.success) {
    const retryAfterSec = Math.ceil((result.reset - Date.now()) / 1000);
    headers['Retry-After'] = String(Math.max(0, retryAfterSec));
  }

  return headers;
}

/**
 * Legacy preset configurations for backwards compatibility.
 * Use named limiters instead when possible.
 *
 * @deprecated Use rateLimit('loginIp', key) instead of rateLimit(key, RATE_LIMITS.login)
 */
export const RATE_LIMITS = {
  auth: { limit: 5, windowMs: 60_000 },
  login: { limit: 5, windowMs: 15 * 60_000 },
  register: { limit: 3, windowMs: 60 * 60_000 },
  api: { limit: 100, windowMs: 60_000 },
  strict: { limit: 10, windowMs: 60_000 },
} as const;

/**
 * Legacy rate limit config type for backwards compatibility.
 * @deprecated Use named limiters instead
 */
export type RateLimitConfig = {
  limit: number;
  windowMs: number;
};
