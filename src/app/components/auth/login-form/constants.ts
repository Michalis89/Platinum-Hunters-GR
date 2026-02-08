export const isCaptchaDisabled = process.env.NODE_ENV === 'development';

export const EXPIRED_RESET_MESSAGE =
  'This password reset link has expired or is invalid. Request a new link to continue safely.';

export const alertToneClass = (type: 'success' | 'error') =>
  type === 'success'
    ? 'border-[var(--apple-system-blue)]/35 bg-[var(--apple-system-blue)]/10 text-[var(--apple-label)]'
    : 'border-[#ff3b30]/35 bg-[#ff3b30]/10 text-[var(--apple-label)]';
