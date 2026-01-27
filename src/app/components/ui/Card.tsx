// components/ui/Card.tsx

import { ReactNode } from 'react';

interface CardProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly id?: string;
}

export function Card({ children, className = '', id }: Readonly<CardProps>) {
  return (
    <div
      id={id}
      className={`rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.45)] ${className}`}
    >
      {children}
    </div>
  );
}

interface CardContentProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function CardContent({ children, className = '' }: Readonly<CardContentProps>) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = '' }: Readonly<CardContentProps>) {
  return <div className={`border-b border-[var(--hb-border)] p-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: Readonly<CardContentProps>) {
  return <div className={`border-t border-[var(--hb-border)] p-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: Readonly<CardContentProps>) {
  return (
    <h3 className={`text-lg font-semibold text-[var(--hb-headline)] ${className}`}>{children}</h3>
  );
}

export function CardDescription({ children, className = '' }: Readonly<CardContentProps>) {
  return <p className={`text-sm text-[var(--hb-muted)] ${className}`}>{children}</p>;
}
