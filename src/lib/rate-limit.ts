/**
 * Rate Limiting Utility
 *
 * Simple sliding window rate limiter for API protection.
 *
 * Current implementation: In-memory (per-instance)
 * - Works well for development and single-instance deployments
 * - Each serverless instance has its own rate limit state
 *
 * For production at scale, upgrade to Upstash Redis:
 * ```
 * npm install @upstash/ratelimit @upstash/redis
 * ```
 * Then use: https://github.com/upstash/ratelimit
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

// In-memory store (per-instance in serverless)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL_MS = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

export type RateLimitConfig = {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
};

export type RateLimitResult = {
  /** Whether the request is allowed */
  success: boolean;
  /** Remaining requests in current window */
  remaining: number;
  /** Unix timestamp (ms) when the limit resets */
  reset: number;
  /** Total limit for the window */
  limit: number;
};

/**
 * Check rate limit for a given identifier.
 *
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and metadata
 *
 * @example
 * ```typescript
 * const result = rateLimit(ip, { limit: 5, windowMs: 60_000 });
 * if (!result.success) {
 *   return new Response('Too Many Requests', {
 *     status: 429,
 *     headers: {
 *       'X-RateLimit-Limit': String(result.limit),
 *       'X-RateLimit-Remaining': String(result.remaining),
 *       'X-RateLimit-Reset': String(result.reset),
 *       'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
 *     },
 *   });
 * }
 * ```
 */
export function rateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  cleanupExpiredEntries();

  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  // If no entry or window expired, create new entry
  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      success: true,
      remaining: config.limit - 1,
      reset: resetAt,
      limit: config.limit,
    };
  }

  // Increment count
  entry.count += 1;

  // Check if over limit
  if (entry.count > config.limit) {
    return {
      success: false,
      remaining: 0,
      reset: entry.resetAt,
      limit: config.limit,
    };
  }

  return {
    success: true,
    remaining: config.limit - entry.count,
    reset: entry.resetAt,
    limit: config.limit,
  };
}

/**
 * Get client IP address from request headers.
 *
 * Handles various proxy configurations (Vercel, Cloudflare, etc.)
 */
export function getClientIp(request: Request): string {
  // Vercel/standard proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP (client IP)
    return forwardedFor.split(',')[0].trim();
  }

  // Cloudflare
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Vercel Edge
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback
  return 'unknown';
}

/**
 * Create rate limit response headers.
 */
export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
    ...(result.success
      ? {}
      : { 'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)) }),
  };
}

// Preset configurations for common use cases
export const RATE_LIMITS = {
  /** Auth endpoints: 5 requests per minute per IP */
  auth: { limit: 5, windowMs: 60_000 },
  /** Login specifically: 5 attempts per 15 minutes */
  login: { limit: 5, windowMs: 15 * 60_000 },
  /** Register: 3 per hour */
  register: { limit: 3, windowMs: 60 * 60_000 },
  /** General API: 100 requests per minute */
  api: { limit: 100, windowMs: 60_000 },
  /** Strict: 10 requests per minute (for expensive operations) */
  strict: { limit: 10, windowMs: 60_000 },
} as const;
