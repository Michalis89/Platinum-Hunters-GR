export const isCaptchaDisabled = process.env.NODE_ENV === 'development';

export const REGISTER_ALLOWED_CATEGORIES = [
  'games',
  'anime',
  'manga',
  'movies',
  'tv',
  'books',
  'coding',
  'pet',
  'vape',
] as const;
