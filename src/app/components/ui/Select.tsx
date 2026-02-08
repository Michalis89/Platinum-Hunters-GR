import { cn } from '@/utils/utils';

interface SelectProps {
  label?: string;
  labelClassName?: string;
  options: readonly string[];
  optionLabels?: Record<string, string>;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  error?: boolean;
}

export function Select({
  label,
  labelClassName = '',
  options,
  optionLabels,
  value,
  onChange,
  className = '',
  placeholder = '-- Επιλέξτε --',
  error = false,
}: Readonly<SelectProps>) {
  return (
    <div className="space-y-1">
      {label && (
        <label
          className={cn(
            'apple-body-tracking text-sm font-medium text-[var(--apple-label)]',
            labelClassName,
          )}
        >
          {label}
        </label>
      )}

      <div className="relative">
        <select
          value={value}
          onChange={e => onChange?.(e.target.value)}
          className={cn(
            'w-full appearance-none rounded-[var(--apple-radius-control)] border-[var(--apple-hairline)] border-[var(--hb-input-border)] bg-[var(--hb-input-bg)] px-3 py-2.5 pr-10 text-sm text-[var(--apple-label)] transition',
            'focus:border-[var(--hb-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--hb-ring)]',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/30',

            className,
          )}
        >
          {/* Placeholder */}
          <option
            value=""
            className="bg-[var(--hb-panel)] text-[var(--apple-secondary-label)]"
          >
            {placeholder}
          </option>

          {/* Options */}
          {options.map(opt => (
            <option
              key={opt}
              value={opt}
              className="bg-[var(--hb-panel)] text-[var(--apple-label)]"
            >
              {optionLabels?.[opt] ?? opt}
            </option>
          ))}
        </select>

        {/* Chevron */}
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-[var(--apple-secondary-label)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
