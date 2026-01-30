import { TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: boolean;
  className?: string;
}

export function Textarea({ label, error, className = '', ...props }: Readonly<TextareaProps>) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-[var(--hb-headline)]">{label}</label>}
      <textarea
        {...props}
        className={cn(
          'w-full rounded-lg border bg-[var(--hb-panel)] p-3 text-[var(--hb-text)] placeholder:text-[var(--hb-muted)] placeholder:opacity-70 transition focus:outline-none focus:ring-2 focus:ring-[var(--hb-primary)] focus:border-[var(--hb-primary-strong)]',
          error ? 'border-red-500' : 'border-[var(--hb-border)]',
          className,
        )}
      />
    </div>
  );
}
