import { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, ...props }: Readonly<TextareaProps>) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-[var(--hb-headline)]">{label}</label>}
      <textarea
        {...props}
        className="w-full rounded-lg border border-[var(--hb-border)] bg-[var(--hb-panel)] p-3 text-[var(--hb-text)] placeholder:text-[var(--hb-muted)] placeholder:opacity-70 transition focus:outline-none focus:ring-2 focus:ring-[var(--hb-primary)] focus:border-[var(--hb-primary-strong)]"
      />
    </div>
  );
}
