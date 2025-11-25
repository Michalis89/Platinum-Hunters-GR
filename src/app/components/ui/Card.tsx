// components/ui/Card.tsx

import { ReactNode } from 'react';

interface CardProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function Card({ children, className = '' }: Readonly<CardProps>) {
  return <div className={`rounded-lg bg-gray-800 shadow-md ${className}`}>{children}</div>;
}

interface CardContentProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function CardContent({ children, className = '' }: Readonly<CardContentProps>) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = '' }: Readonly<CardContentProps>) {
  return <div className={`border-b border-gray-700 p-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: Readonly<CardContentProps>) {
  return <div className={`border-t border-gray-700 p-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: Readonly<CardContentProps>) {
  return <h3 className={`text-lg font-semibold text-white ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }: Readonly<CardContentProps>) {
  return <p className={`text-sm text-gray-400 ${className}`}>{children}</p>;
}
