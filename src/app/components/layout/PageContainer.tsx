import { ReactNode } from 'react';

/**
 * PageContainer - Unified container component for consistent page widths.
 *
 * Sizes:
 * - 'sm': max-w-4xl (896px) - Legal pages, narrow content
 * - 'md': max-w-5xl (1024px) - Article/guide detail pages
 * - 'lg': max-w-6xl (1152px) - Default for most content pages
 * - 'xl': max-w-7xl (1280px) - Listings, grids, catalogs
 */

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl';

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
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
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
