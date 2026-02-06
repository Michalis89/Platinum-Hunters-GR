import { Button } from '@/components/ui/button';

type ErrorStateProps = {
  error: string | Error;
  onRetry?: () => void;
};

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  const message = typeof error === 'string' ? error : error.message;

  return (
    <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] px-6 py-16 text-center">
      <h2 className="mb-2 text-xl font-semibold text-[var(--hb-headline)]">Σφάλμα</h2>
      <p className="text-[var(--hb-muted)]">{message}</p>
      {onRetry ? (
        <div className="mt-6 flex justify-center">
          <Button onClick={onRetry} variant="secondary">
            Δοκίμασε ξανά
          </Button>
        </div>
      ) : null}
    </div>
  );
}
