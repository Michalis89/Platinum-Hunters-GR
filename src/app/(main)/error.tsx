'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Something went wrong</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          An unexpected error occurred. Try again, or go back to the dashboard.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} variant="primary">
          Try again
        </Button>
        <Button variant="outline" asChild>
          <a href="/home">Go home</a>
        </Button>
      </div>
    </div>
  );
}
