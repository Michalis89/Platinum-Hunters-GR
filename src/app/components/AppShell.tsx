import React from 'react';
import NavbarWrapper from './NavbarWrapper';
import { Footer } from './layout/Footer';

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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--hb-bg)] text-[var(--hb-text)]">
      {/* Ambient gradient glow - standardized to 100px blur */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-70">
        <div className="absolute inset-0 bg-[var(--hb-gradient)] blur-[100px]" />
      </div>

      {/* Content wrapper with flex layout for sticky footer */}
      <div className="relative flex min-h-screen flex-col">
        <NavbarWrapper />
        <main
          className="flex-1 pb-12 pt-4 scroll-smooth"
          style={{ scrollPaddingBlockStart: '6rem' }}
        >
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
