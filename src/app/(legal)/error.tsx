'use client';

import { Button } from '@/components/ui/button';

export default function LegalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-xl font-semibold text-foreground">Failed to load page</h2>
      <Button onClick={reset} variant="primary">
        Try again
      </Button>
    </div>
  );
}
