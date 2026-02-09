/**
 * Shared Auth Session Utilities
 * Server-side session validation and error checking
 */

import type { Session, User } from '@supabase/supabase-js';

/**
 * Check if an error message indicates a session issue
 * Used for consistent error handling across auth flows
 */
export function isSessionError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('auth session missing') ||
    normalized.includes('invalid session') ||
    normalized.includes('jwt') ||
    normalized.includes('session expired') ||
    normalized.includes('token') && normalized.includes('expired')
  );
}

/**
 * Validate that a session exists and is valid
 * Returns typed error or null if valid
 */
export function validateSession(
  session: Session | null,
  user: User | null,
): { valid: false; error: string } | { valid: true; session: Session; user: User } {
  if (!session || !user) {
    return {
      valid: false,
      error: 'Your session has expired. Please sign in again.',
    };
  }

  // Check if session is expired
  const expiresAt = session.expires_at;
  if (expiresAt && expiresAt * 1000 < Date.now()) {
    return {
      valid: false,
      error: 'Your session has expired. Please sign in again.',
    };
  }

  return {
    valid: true,
    session,
    user,
  };
}

/**
 * Check if user has confirmed their email
 */
export function isEmailConfirmed(user: User | null): boolean {
  return Boolean(user?.email_confirmed_at);
}

/**
 * Common session-related error messages
 */
export const SESSION_ERRORS = {
  EXPIRED: 'Your session has expired. Please sign in again.',
  INVALID: 'Invalid session. Please sign in again.',
  MISSING: 'Authentication required. Please sign in.',
  EMAIL_NOT_CONFIRMED: 'Please confirm your email address to continue.',
  RECOVERY_EXPIRED: 'Your password reset link has expired. Please request a new one.',
} as const;
