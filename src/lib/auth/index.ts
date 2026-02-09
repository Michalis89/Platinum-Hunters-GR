/**
 * Auth Utilities Index
 * Central export for all auth-related utilities
 */

export {
  setAuthCookies,
  clearAuthCookies,
  getAuthCookieOptions,
  getPersistentAuthCookieOptions,
  getAuthCookieNames,
} from './cookies';

export {
  isSessionError,
  validateSession,
  isEmailConfirmed,
  SESSION_ERRORS,
} from './session';

export { resolveSiteUrl } from './site-url';
