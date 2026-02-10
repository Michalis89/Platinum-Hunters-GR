'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type SuccessAutoRedirectProps = {
  seconds?: number;
  to?: string;
};

export default function SuccessAutoRedirect({
  seconds = 6,
  to = '/auth/login',
}: SuccessAutoRedirectProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(seconds);

  useEffect(() => {
    if (countdown <= 0) {
      router.push(to);
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown(previous => previous - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown, router, to]);

  return (
    <p className="text-center text-sm text-[var(--hb-muted)]" aria-live="polite">
      Auto redirect to sign in in {countdown}s.
    </p>
  );
}
