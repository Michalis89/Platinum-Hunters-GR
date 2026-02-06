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
            'text-sm font-medium text-slate-700 dark:text-white',
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
            // Base
            'w-full appearance-none rounded-xl border p-3 pr-10 text-sm shadow-inner transition',

            'border-slate-200 bg-white text-slate-900 shadow-slate-200/40',
            'hover:border-emerald-400/70 hover:bg-slate-50',
            'focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40',

            'dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-100 dark:shadow-slate-950/40',
            'dark:hover:border-emerald-400/70 dark:hover:bg-slate-900/90',
            'dark:focus:border-emerald-300 dark:focus:ring-emerald-400/50',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/40',

            className,
          )}
        >
          {/* Placeholder */}
          <option
            value=""
            className="bg-white text-slate-400 dark:bg-slate-950 dark:text-slate-400"
          >
            {placeholder}
          </option>

          {/* Options */}
          {options.map(opt => (
            <option
              key={opt}
              value={opt}
              className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100"
            >
              {optionLabels?.[opt] ?? opt}
            </option>
          ))}
        </select>

        {/* Chevron */}
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-slate-500 dark:text-slate-400"
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
