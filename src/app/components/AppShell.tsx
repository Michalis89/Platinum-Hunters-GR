import React from 'react';
import NavbarWrapper from './NavbarWrapper';
import FooterWrapper from './layout/FooterWrapper';
import MobileTabBar from './navbar/MobileTabBar';

type Props = {
  children: React.ReactNode;
};

/**
 * AppShell - Root layout wrapper for the entire application.
 *
 * Provides:
 * - Consistent background with theme variables
 * - Unified gradient glow effect (100px blur)
 * - Fixed navbar at top
 * - Footer at bottom (via flex layout)
 * - Main content area with proper spacing
 *
 * Note: Individual pages should NOT include <Footer /> - it's handled here.
 * Pages control their own container width using <PageContainer size="...">
 */
export default function AppShell({ children }: Props) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      {/* Ambient gradient glow - Performance-first: no blur */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 4% -12%, hsl(var(--accent-primary) / 0.08), transparent 48%), radial-gradient(circle at 88% -10%, hsl(var(--accent-primary) / 0.06), transparent 44%)',
          }}
        />
      </div>

      {/* Content wrapper with flex layout for sticky footer */}
      <div className="relative flex min-h-screen flex-col">
        <NavbarWrapper />
        <main
          id="main-content"
          className="flex-1 scroll-smooth"
          style={{ scrollPaddingBlockStart: '6rem' }}
        >
          {children}
        </main>
        <FooterWrapper />
        <MobileTabBar />
      </div>
    </div>
  );
}
