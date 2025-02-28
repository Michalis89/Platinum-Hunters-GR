import { ReactNode } from 'react';

interface CardProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function Card({ children, className }: Readonly<CardProps>) {
  return <div className={`rounded-lg bg-gray-800 p-4 shadow-md ${className}`}>{children}</div>;
}

interface CardContentProps {
  readonly children: ReactNode;
}

export function CardContent({ children }: Readonly<CardContentProps>) {
  return <div className="p-4">{children}</div>;
}
