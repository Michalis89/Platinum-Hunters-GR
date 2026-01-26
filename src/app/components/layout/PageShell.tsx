import { ReactNode } from 'react';

/**
 * PageShell - Unified background wrapper for consistent page styling.
 *
 * Provides:
 * - Consistent background color using theme variables
 * - Unified gradient blur effect (100px standard)
 * - Min-height screen coverage
 * - Proper text color inheritance
 *
 * Usage:
 * <PageShell>
 *   <PageContainer>
 *     {content}
 *   </PageContainer>
 * </PageShell>
 */

interface PageShellProps {
  children: ReactNode;
  className?: string;
  /** Show the ambient gradient glow effect (default: true) */
  showGradient?: boolean;
  /** Override gradient opacity (default: 0.7) */
  gradientOpacity?: number;
}

export function PageShell({
  children,
  className = '',
  showGradient = true,
  gradientOpacity = 0.7,
}: Readonly<PageShellProps>) {
  return (
    <div
      className={`relative min-h-screen bg-[var(--hb-bg)] text-[var(--hb-text)] ${className}`}
    >
      {/* Ambient gradient glow */}
      {showGradient && (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ opacity: gradientOpacity }}
        >
          <div className="absolute inset-0 bg-[var(--hb-gradient)] blur-[100px]" />
        </div>
      )}

      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  );
}

export type { PageShellProps };
