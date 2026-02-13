'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Select as FloatingSelect,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './select';

export interface SelectFieldProps {
  /** Optional label shown above the trigger. */
  label?: React.ReactNode;
  /** Additional classes applied to the label. */
  labelClassName?: string;
  /** The list of values to render inside the dropdown. */
  options: readonly string[];
  /** Optional display labels for specific values. */
  optionLabels?: Record<string, React.ReactNode>;
  /** Controlled value. */
  value?: string;
  /** Change handler. */
  onChange?: (value: string) => void;
  /** Additional classes applied to the trigger button. */
  className?: string;
  /** Placeholder text shown when nothing is selected. */
  placeholder?: string;
  /** Show an invalid state border. */
  error?: boolean;
  /** Classes applied to the floating content wrapper. */
  contentClassName?: string;
}

export function SelectField({
  label,
  labelClassName,
  options = [],
  optionLabels,
  value,
  onChange,
  className,
  placeholder = 'Select an option',
  error = false,
  contentClassName,
}: SelectFieldProps) {
  const normalizedValue = value ?? '';
  const placeholderLabel = optionLabels?.[''] ?? placeholder;

  return (
    <div className="space-y-1">
      {label && (
        <label className={cn('text-sm font-medium text-foreground', labelClassName)}>
          {label}
        </label>
      )}
      <FloatingSelect
        value={normalizedValue}
        onValueChange={nextValue => {
          const normalizedValue = nextValue === '__placeholder__' ? '' : nextValue;
          onChange?.(normalizedValue);
        }}
      >
        <SelectTrigger
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border-[var(--hb-input-border)] bg-[var(--hb-input-bg)] px-3 py-2 text-sm text-foreground min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
              : 'border-[var(--hb-input-border)] focus:border-[var(--hb-primary)] focus:ring-2 focus:ring-[var(--hb-ring)]',
            className,
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          className={cn(
            'max-h-64 rounded-xl border border-border bg-card text-foreground shadow-lg',
            contentClassName,
          )}
        >
          {options.map((option, index) => (
            <SelectItem
              key={`${option || '__empty__'}-${index}`}
              value={option || '__placeholder__'}
              className="text-foreground"
            >
              {option === '' ? placeholderLabel : optionLabels?.[option] ?? option}
            </SelectItem>
          ))}
        </SelectContent>
      </FloatingSelect>
    </div>
  );
}
