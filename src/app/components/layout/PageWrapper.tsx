import { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

export function PageWrapper({ children, className = '' }: Readonly<PageWrapperProps>) {
  return <div className={`mx-auto w-full max-w-7xl px-4 py-8 ${className}`}>{children}</div>;
}
