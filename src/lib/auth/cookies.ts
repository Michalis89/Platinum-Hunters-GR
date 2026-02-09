/**
 * Shared Auth Cookie Utilities
 * Centralized cookie management for authentication
 */

import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

const AUTH_COOKIE_NAMES = {
  ACCESS_TOKEN: 'sb-access-token',
  REFRESH_TOKEN: 'sb-refresh-token',
} as const;

/**
 * Get base cookie options for auth cookies
 * These are shared across all auth cookie operations
 */
export function getAuthCookieOptions(): Partial<ResponseCookie> {
  return {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };
}

/**
 * Get persistent cookie options (for "remember me" functionality)
 * Extends base options with 30-day expiry
 */
export function getPersistentAuthCookieOptions(): Partial<ResponseCookie> {
  return {
    ...getAuthCookieOptions(),
    maxAge: 60 * 60 * 24 * 30, // 30 days
  };
}

/**
 * Set auth session cookies
 * Used after successful login or token refresh
 */
export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  persistent = false,
) {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const options = persistent ? getPersistentAuthCookieOptions() : getAuthCookieOptions();

  cookieStore.set(AUTH_COOKIE_NAMES.ACCESS_TOKEN, accessToken, options);
  cookieStore.set(AUTH_COOKIE_NAMES.REFRESH_TOKEN, refreshToken, options);
}

/**
 * Clear auth session cookies
 * Used during logout or after password change
 */
export async function clearAuthCookies() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  cookieStore.delete(AUTH_COOKIE_NAMES.ACCESS_TOKEN);
  cookieStore.delete(AUTH_COOKIE_NAMES.REFRESH_TOKEN);
}

/**
 * Get auth cookie names (useful for reference)
 */
export function getAuthCookieNames() {
  return AUTH_COOKIE_NAMES;
}
