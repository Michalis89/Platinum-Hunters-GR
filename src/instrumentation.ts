import * as Sentry from '@sentry/nextjs';

export async function register() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    sendDefaultPii: false,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  });
}

export const onRequestError = Sentry.captureRequestError;
