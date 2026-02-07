import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-2 text-sm text-[var(--hb-text)] placeholder:text-[var(--hb-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hb-primary-strong)]/50 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
