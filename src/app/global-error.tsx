'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type GlobalErrorProps = {
  reset: () => void;
};

export default function GlobalError({ reset }: GlobalErrorProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-xl p-8 text-center">
        <div className="bg-[#ff3b30]/12 mx-auto mb-4 flex h-12 w-12 items-center justify-center text-[#ff3b30]">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mb-3 text-3xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mx-auto mb-7 max-w-xl text-sm text-muted-foreground">
          The application encountered an unexpected error. You can try again or return to the home
          page.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button type="button" variant="primary" onClick={reset}>
            Try again
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push('/')}>
            Go to home
          </Button>
        </div>
      </section>
    </div>
  );
}
