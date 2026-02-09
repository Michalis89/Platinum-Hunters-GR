import { TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: boolean;
  className?: string;
}

export function Textarea({ label, error, className = '', ...props }: Readonly<TextareaProps>) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="apple-body-tracking text-sm font-medium text-[var(--apple-label)]">
          {label}
        </label>
      )}
      <textarea
        {...props}
        suppressHydrationWarning
        className={cn(
          'w-full rounded-[var(--apple-radius-control)] border-[var(--apple-hairline)] bg-[var(--hb-input-bg)] px-3 py-2.5 text-[var(--hb-text)] placeholder:text-[var(--hb-input-placeholder)] transition focus:outline-none focus:ring-2 focus:ring-[var(--hb-ring)] focus:border-[var(--hb-primary)]',
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
            : 'border-[var(--hb-input-border)]',
          className,
        )}
      />
    </div>
  );
}
