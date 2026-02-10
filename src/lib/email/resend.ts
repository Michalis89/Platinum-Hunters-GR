import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const isDevelopment = process.env.NODE_ENV === 'development';

// In development, allow missing API key and use test mode
if (!apiKey && !isDevelopment) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

// Use test/dev API key if in development and no key is set
const effectiveApiKey = apiKey || (isDevelopment ? 're_123456789' : '');

export const resend = new Resend(effectiveApiKey);
