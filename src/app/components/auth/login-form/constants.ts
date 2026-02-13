export const isCaptchaDisabled = process.env.NODE_ENV === 'development';

export const EXPIRED_RESET_MESSAGE =
  'This password reset link has expired or is invalid. Request a new link to continue safely.';

export const alertToneClass = (type: 'success' | 'error') =>
  type === 'success'
    ? 'border-primary/35 bg-background text-foreground'
    : 'border-[#ff3b30]/35 bg-[#ff3b30]/10 text-foreground';
