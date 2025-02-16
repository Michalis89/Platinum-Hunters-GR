import { ReactNode } from "react";

interface CardProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function Card({ children, className }: Readonly<CardProps>) {
  return <div className={`bg-gray-800 p-4 rounded-lg shadow-md ${className}`}>{children}</div>;
}

interface CardContentProps {
  readonly children: ReactNode;
}

export function CardContent({ children }: Readonly<CardContentProps>) {
  return <div className="p-4">{children}</div>;
}
