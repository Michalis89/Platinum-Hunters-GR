import { InputHTMLAttributes, useId } from 'react';
import { cn } from '@/utils/utils';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  className?: string;
}

export function Switch({ label, description, className = '', id, ...props }: Readonly<SwitchProps>) {
  const autoId = useId();
  const resolvedId = id ?? autoId;

  return (
    <label htmlFor={resolvedId} className={cn('flex items-start justify-between gap-4', className)}>
      <span className="flex flex-col gap-1">
        {label ? <span className="text-sm font-medium text-[var(--hb-headline)]">{label}</span> : null}
        {description ? <span className="text-xs text-[var(--hb-muted)]">{description}</span> : null}
      </span>
      <span className="relative inline-flex h-6 w-11 items-center">
        <input id={resolvedId} type="checkbox" className="peer sr-only" {...props} />
        <span
          className="h-6 w-11 rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] transition peer-checked:border-[var(--hb-primary)] peer-checked:bg-[var(--hb-primary-strong)]"
          aria-hidden
        />
        <span
          className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5"
          aria-hidden
        />
      </span>
    </label>
  );
}

export type { SwitchProps };
