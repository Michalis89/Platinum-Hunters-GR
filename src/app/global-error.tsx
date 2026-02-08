'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { captureException } from '@sentry/nextjs';
import { Button } from '@/components/ui/button';

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
    <div className="apple-auth-shell flex min-h-screen items-center justify-center px-4">
      <section className="apple-auth-card w-full max-w-xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--apple-radius-control)] bg-[#ff3b30]/12 text-[#ff3b30]">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="apple-title-tracking mb-3 text-3xl font-semibold text-[var(--apple-label)]">
          Κάτι πήγε στραβά
        </h1>
        <p className="apple-body-tracking mx-auto mb-7 max-w-xl text-sm text-[var(--apple-secondary-label)]">
          Η εφαρμογή αντιμετώπισε ένα απρόσμενο σφάλμα. Μπορείς να δοκιμάσεις ξανά ή να
          επιστρέψεις στην αρχική σελίδα.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button type="button" variant="primary" onClick={reset}>
            Δοκίμασε ξανά
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push('/')}>
            Αρχική
          </Button>
        </div>
      </section>
    </div>
  );
}
