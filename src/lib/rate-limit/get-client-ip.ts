/**
 * Client IP Address Extraction
 *
 * Hardened IP extraction that handles various proxy configurations.
 * Priority order ensures we use the most trustworthy header available.
 *
 * Security considerations:
 * - x-vercel-forwarded-for: Set by Vercel edge, cannot be spoofed by clients
 * - cf-connecting-ip: Set by Cloudflare, trusted when using CF
 * - x-real-ip: Set by reverse proxies, generally trustworthy
 * - x-forwarded-for: Standard but can be spoofed; we take only the first IP
 */

/**
 * Get client IP address from request headers.
 *
 * Handles various proxy configurations (Vercel, Cloudflare, etc.)
 * Priority order ensures we use the most trustworthy header available.
 */
export function getClientIp(request: Request): string {
  // Vercel's verified header (cannot be spoofed by client)
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    return vercelIp.split(',')[0].trim();
  }

  // Cloudflare (trusted when using CF)
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Vercel Edge / nginx real IP
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Standard proxy header (less trustworthy, can be spoofed)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Fallback
  return 'unknown';
}
