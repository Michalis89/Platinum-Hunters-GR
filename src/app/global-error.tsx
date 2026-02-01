'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { captureException } from '@sentry/nextjs';

type GlobalErrorProps = {
  error: Error;
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const router = useRouter();

  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--hb-bg)] px-4 text-center text-[var(--hb-text)]">
      <h1 className="mb-4 text-3xl font-bold">Κάτι πήγε στραβά</h1>
      <p className="mb-6 max-w-xl text-sm text-[var(--hb-muted)]">
        Η εφαρμογή αντιμετώπισε ένα απρόσμενο σφάλμα. Μπορείς να δοκιμάσεις ξανά ή να επιστρέψεις
        στην αρχική σελίδα.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            reset();
          }}
          className="rounded-full bg-[var(--hb-primary)] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[var(--hb-primary-strong)]"
        >
          Δοκίμασε ξανά
        </button>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="rounded-full border border-[var(--hb-border)] px-6 py-2 text-sm font-semibold text-[var(--hb-text)] transition hover:bg-white/10"
        >
          Αρχική
        </button>
      </div>
    </div>
  );
}
