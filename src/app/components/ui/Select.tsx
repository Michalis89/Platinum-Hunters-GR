import { cn } from '@/utils/utils';

interface SelectProps {
  label?: string;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function Select({ label, options, value, onChange, className = '' }: Readonly<SelectProps>) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-white">{label}</label>}
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange?.(e.target.value)}
          className={cn(
            'w-full appearance-none rounded-xl border border-slate-800 bg-slate-950/80 p-3 pr-10 text-sm text-slate-100 shadow-inner shadow-slate-950/40 transition',
            'hover:border-emerald-400/70 hover:bg-slate-900/90 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/50',
            className,
          )}
        >
          <option value="" className="bg-slate-950 text-slate-400">
            -- Επιλέξτε --
          </option>
          {options.map(opt => (
            <option key={opt} value={opt} className="bg-slate-950 text-slate-100">
              {opt}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-slate-400"
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
