import type { ReactNode } from 'react';
import { CollapsibleCard } from '@/app/components/ui/CollapsibleCard.client';

interface CardContentProps {
  readonly children: ReactNode;
  readonly className?: string;
}

interface CardProps extends CardContentProps {
  readonly id?: string;
  readonly collapsible?: boolean;
  readonly defaultCollapsed?: boolean;
}

export function Card({
  children,
  className = '',
  id,
  collapsible = false,
  defaultCollapsed = false,
}: Readonly<CardProps>) {
  if (collapsible) {
    return (
      <CollapsibleCard id={id} className={className} defaultCollapsed={defaultCollapsed}>
        {children}
      </CollapsibleCard>
    );
  }

  return (
    <div
      id={id}
      className={`rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[var(--hb-shadow-md)] dark:border-[var(--hb-border)] dark:bg-[var(--hb-panel)] dark:text-[var(--hb-text)] dark:shadow-[var(--hb-shadow-md)] ${className}`}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }: Readonly<CardContentProps>) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = '' }: Readonly<CardContentProps>) {
  return (
    <div
      className={`border-b border-slate-200 bg-white/80 p-4 text-slate-900 dark:border-[var(--hb-border)] dark:bg-[var(--hb-card)] dark:text-[var(--hb-text)] ${className}`}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: Readonly<CardContentProps>) {
  return (
    <div
      className={`border-t border-slate-200 p-4 text-slate-900 dark:border-[var(--hb-border)] dark:text-[var(--hb-text)] ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: Readonly<CardContentProps>) {
  return (
    <h3
      className={`text-lg font-semibold text-slate-900 dark:text-[var(--hb-headline)] ${className}`}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }: Readonly<CardContentProps>) {
  return (
    <p className={`text-sm text-slate-600 dark:text-[var(--hb-muted)] ${className}`}>{children}</p>
  );
}
