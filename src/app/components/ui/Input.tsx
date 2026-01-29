import { InputHTMLAttributes } from 'react';
import { cn } from '@/utils/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  className?: string;
}

export function Input({ label, error, className = '', ...props }: Readonly<InputProps>) {
  const baseClasses =
    'w-full rounded-lg border bg-[var(--hb-panel)] p-3 text-[var(--hb-text)] dark:text-[var(--hb-text)] placeholder:text-[var(--hb-muted)] placeholder:opacity-80 focus:placeholder-transparent transition focus:outline-none focus:ring-2 focus:ring-[var(--hb-primary)] focus:border-[var(--hb-primary-strong)] dark:focus:ring-[var(--hb-primary)] dark:focus:border-[var(--hb-primary-strong)]';
  const errorClasses = error ? 'border-red-500' : 'border-[var(--hb-border)]';

  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-[var(--hb-headline)]">{label}</label>}
      <input {...props} className={cn(baseClasses, errorClasses, className)} />
    </div>
  );
}
