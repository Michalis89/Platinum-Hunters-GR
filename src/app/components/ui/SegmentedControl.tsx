import { cn } from '@/utils/utils';

export type SegmentedOption = {
  id: string;
  label: string;
  description?: string;
};

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className = '',
}: Readonly<SegmentedControlProps>) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex flex-wrap gap-2 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-2',
        className,
      )}
    >
      {options.map(option => {
        const isActive = option.id === value;
        return (
          <button
            key={option.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={cn(
              'flex flex-1 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition',
              isActive
                ? 'bg-[var(--hb-primary-strong)] text-[var(--hb-bg)] shadow-[var(--hb-shadow-md)]'
                : 'text-[var(--hb-text)] hover:bg-[var(--hb-card)]',
            )}
          >
            <span className="flex flex-col">
              <span>{option.label}</span>
              {option.description ? (
                <span className="text-xs font-normal text-[var(--hb-text-dark)] dark:text-[var(--hb-text-light)]">
                  {option.description}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export type { SegmentedControlProps };
