import { cn } from '@/utils/utils';
import { Button } from '@/components/ui/button';

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
          <Button
            key={option.id}
            role="tab"
            type="button"
            variant={isActive ? 'primary' : 'secondary'}
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={'flex flex-1 items-center justify-center rounded-xl px-4 py-2'}
          >
            <span className="flex flex-col">
              <span>{option.label}</span>
              {option.description ? (
                <span className="text-xs font-normal text-[var(--hb-text-dark)] dark:text-[var(--hb-text-light)]">
                  {option.description}
                </span>
              ) : null}
            </span>
          </Button>
        );
      })}
    </div>
  );
}

export type { SegmentedControlProps };
