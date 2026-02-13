import { ReactNode } from 'react';

/**
 * PageShell - Unified background wrapper for consistent page styling.
 *
 * Provides:
 * - Consistent background color using theme variables
 * - Performance-first gradient effect (no blur for 60fps)
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
    <div className={`relative min-h-screen bg-background text-foreground ${className}`}>
      {/* Ambient gradient - Performance-first: no blur */}
      {showGradient && (
        <div className="pointer-events-none absolute inset-0" style={{ opacity: gradientOpacity }}>
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 4% -12%, hsl(var(--accent-primary) / 0.08), transparent 48%), radial-gradient(circle at 88% -10%, hsl(var(--accent-primary) / 0.06), transparent 44%)',
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  );
}

export type { PageShellProps };
