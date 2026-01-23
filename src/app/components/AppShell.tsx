import React from 'react';
import NavbarWrapper from './NavbarWrapper';

type Props = {
  children: React.ReactNode;
};

/**
 * AppShell ορίζει το κοινό περίβλημα του UI: background, chroma glow και σταθερό navbar χώρο.
 */
export default function AppShell({ children }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--hb-bg)] text-[var(--hb-text)]">
      <div className="pointer-events-none absolute inset-0 opacity-75">
        <div className="absolute inset-0 bg-[var(--hb-gradient)] blur-[80px]" />
      </div>

      <div className="relative">
        <NavbarWrapper />
        <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-4 md:px-6">{children}</main>
      </div>
    </div>
  );
}
