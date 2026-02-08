const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export function resolveSiteUrl(req?: Request): string {
  // In local/dev preview, prefer the incoming request origin so emails point to the
  // environment currently being tested (e.g. localhost).
  if (process.env.NODE_ENV !== 'production' && req) {
    try {
      return trimTrailingSlash(new URL(req.url).origin);
    } catch {
      // Ignore parse errors and continue with env-based fallbacks.
    }
  }

  const explicit =
    process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) {
    return trimTrailingSlash(explicit);
  }

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelUrl) {
    const normalized = vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
    return trimTrailingSlash(normalized);
  }

  if (req) {
    try {
      return trimTrailingSlash(new URL(req.url).origin);
    } catch {
      // Ignore parse errors and fall through to localhost default.
    }
  }

  return 'http://localhost:3000';
}
