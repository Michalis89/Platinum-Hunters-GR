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
      className={`rounded-[var(--apple-radius-card)] border border-[var(--apple-separator)] bg-[var(--hb-panel)] text-[var(--apple-label)] shadow-[var(--apple-shadow)] backdrop-blur-[18px] ${className}`}
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
      className={`border-b border-[var(--apple-separator-soft)] bg-[var(--hb-card)]/85 p-4 text-[var(--apple-label)] ${className}`}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: Readonly<CardContentProps>) {
  return (
    <div
      className={`border-t border-[var(--apple-separator-soft)] p-4 text-[var(--apple-label)] ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: Readonly<CardContentProps>) {
  return (
    <h3
      className={`apple-title-tracking text-lg font-semibold text-[var(--apple-label)] ${className}`}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }: Readonly<CardContentProps>) {
  return (
    <p className={`apple-body-tracking text-sm text-[var(--apple-secondary-label)] ${className}`}>
      {children}
    </p>
  );
}
