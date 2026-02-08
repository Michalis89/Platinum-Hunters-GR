import { InputHTMLAttributes } from 'react';
import { cn } from '@/utils/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  className?: string;
}

export function Input({ label, error, className = '', ...props }: Readonly<InputProps>) {
  const baseClasses =
    'w-full rounded-[var(--apple-radius-control)] border-[var(--apple-hairline)] bg-[var(--hb-input-bg)] px-3 py-2.5 text-[var(--hb-text)] placeholder:text-[var(--hb-input-placeholder)] transition focus:outline-none focus:ring-2 focus:ring-[var(--hb-ring)] focus:border-[var(--hb-primary)]';
  const errorClasses = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
    : 'border-[var(--hb-input-border)]';

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="apple-body-tracking text-sm font-medium text-[var(--apple-label)]">
          {label}
        </label>
      )}
      <input {...props} className={cn(baseClasses, errorClasses, className)} />
    </div>
  );
}
