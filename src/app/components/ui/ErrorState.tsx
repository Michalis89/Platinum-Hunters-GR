import { Button } from '@/components/ui/button';

type ErrorStateProps = {
  error: string | Error;
  onRetry?: () => void;
};

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  const message = typeof error === 'string' ? error : error.message;

  return (
    <div className="apple-destructive-surface px-5 py-5 text-left">
      <h2 className="apple-title-tracking mb-2 text-base font-semibold text-[var(--apple-label)]">
        Σφάλμα
      </h2>
      <p className="apple-body-tracking text-sm text-[var(--apple-secondary-label)]">{message}</p>
      {onRetry ? (
        <div className="mt-4 flex">
          <Button onClick={onRetry} variant="secondary">
            Δοκίμασε ξανά
          </Button>
        </div>
      ) : null}
    </div>
  );
}
