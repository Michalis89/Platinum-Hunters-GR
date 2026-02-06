/**
 * Shared constants for error messages, fallbacks, and common values
 * Used across API routes and services
 */

/**
 * Authentication and authorization
 */
export const AUTH_ERROR = 'Μη εξουσιοδοτημένη πρόσβαση';
export const MISSING_MEDIA_ID = 'Missing mediaId';
export const MISSING_PAYLOAD = 'Missing media payload';
export const INVALID_PAYLOAD = 'Invalid media payload';
export const UNSUPPORTED_CATEGORY = 'Unsupported category';

/**
 * Fallback values
 */
export const UNTITLED_FALLBACK = 'Untitled';
export const DEFAULT_COVER = '/og-image.png';

/**
 * Common error messages
 */
export const INTERNAL_SERVER_ERROR = 'Internal server error';
export const NO_UPDATES_PROVIDED = 'No updates provided';
export const FAILED_TO_RESOLVE_MEDIA_ID = 'Failed to resolve media ID';
