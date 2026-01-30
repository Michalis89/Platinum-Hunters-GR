import { InputHTMLAttributes, useId } from 'react';
import { cn } from '@/utils/utils';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: boolean;
  className?: string;
}

export function Checkbox({
  label,
  description,
  error = false,
  className = '',
  id,
  ...props
}: Readonly<CheckboxProps>) {
  const autoId = useId();
  const resolvedId = id ?? autoId;

  return (
    <label
      htmlFor={resolvedId}
      className={cn('flex cursor-pointer items-start gap-3 text-sm', className)}
    >
      <input
        id={resolvedId}
        type="checkbox"
        className={cn(
          'mt-0.5 h-4 w-4 rounded border border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-primary-strong)] focus:ring-2 focus:ring-[var(--hb-primary-strong)]',
          error && 'border-red-500',
        )}
        {...props}
      />
      <span className="flex flex-col gap-1">
        {label ? <span className="font-medium text-[var(--hb-headline)]">{label}</span> : null}
        {description ? <span className="text-[var(--hb-muted)]">{description}</span> : null}
      </span>
    </label>
  );
}

export type { CheckboxProps };
