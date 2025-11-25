import { ReactNode } from 'react';

interface GridListProps {
  children: ReactNode;
  className?: string;
}

export function GridList({ children, className = '' }: Readonly<GridListProps>) {
  return (
    <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 ${className}`}>
      {children}
    </div>
  );
}
