import type { ReactNode } from 'react';

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface PageContainerProps {
  children: ReactNode;
  size?: ContainerSize;
  className?: string;
  /** Remove default horizontal padding */
  noPadding?: boolean;
}

const sizeClasses: Record<ContainerSize, string> = {
  sm: 'max-w-4xl',
  md: 'max-w-5xl',
  lg: 'max-w-screen-2xl',
  xl: 'max-w-screen-2xl',
  full: 'max-w-none',
};

export function PageContainer({
  children,
  size = 'lg',
  className = '',
  noPadding = false,
}: Readonly<PageContainerProps>) {
  const paddingClass = noPadding ? '' : 'px-4 md:px-6';

  return (
    <div className={`mx-auto w-full ${sizeClasses[size]} ${paddingClass} ${className}`}>
      {children}
    </div>
  );
}

export type { ContainerSize, PageContainerProps };
