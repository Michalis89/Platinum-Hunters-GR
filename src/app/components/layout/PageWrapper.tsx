import { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

export function PageWrapper({ children, className = '' }: Readonly<PageWrapperProps>) {
  return <div className={`mx-auto w-full max-w-screen-2xl ${className}`}>{children}</div>;
}
