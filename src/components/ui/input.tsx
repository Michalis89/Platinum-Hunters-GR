'use client';

import * as React from 'react';
import { useId } from 'react';

import { cn } from '@/lib/utils';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';

const baseClassName =
  'flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const InputBase = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return <input type={type} className={cn(baseClassName, className)} ref={ref} {...props} />;
  },
);
InputBase.displayName = 'InputBase';

type InputProps = React.ComponentProps<'input'> & {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: boolean | string;
  fieldClassName?: string;
  labelClassName?: string;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, description, error, fieldClassName, labelClassName, className, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? `input-${generatedId}`;
    const hasLabel = Boolean(label);
    const hasErrorMessage = typeof error === 'string';
    const isInvalid = Boolean(error);

    const content = (
      <InputBase id={inputId} ref={ref} className={className} aria-invalid={isInvalid} {...props} />
    );

    if (!hasLabel) {
      return content;
    }

    return (
      <Field data-invalid={isInvalid} className={cn('gap-2', fieldClassName)}>
        <FieldLabel htmlFor={inputId} className={labelClassName}>
          {label}
        </FieldLabel>
        <FieldContent>
          {content}
          {description && <FieldDescription>{description}</FieldDescription>}
          {hasErrorMessage && <FieldError>{error}</FieldError>}
        </FieldContent>
      </Field>
    );
  },
);

Input.displayName = 'Input';

export { Input, InputBase };
