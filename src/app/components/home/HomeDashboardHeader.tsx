'use client';

import { useState, useEffect } from 'react';

type HomeDashboardHeaderProps = {
  username: string;
  displayName?: string | null;
};

function useGreeting() {
  const [greeting, setGreeting] = useState<string>('Γεια σου');

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  return greeting;
}

export function HomeDashboardHeader({ username, displayName }: HomeDashboardHeaderProps) {
  const greeting = useGreeting();

  const name = displayName || username;

  return (
    <section className="px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              className="mb-1 min-h-[1.25rem] text-sm text-[var(--hb-muted)]"
              suppressHydrationWarning
            >
              {greeting}
            </p>
            <h1 className="text-2xl font-bold text-[var(--hb-headline)] md:text-3xl">
              Καλωσόρισες,{' '}
              <span className="bg-gradient-to-r from-[var(--hb-primary-strong)] to-[var(--hb-accent)] bg-clip-text text-transparent">
                {name}
              </span>
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
}

function getGreeting(): string {
  return new Date().getHours() < 12 ? 'Καλημέρα' : 'Καλησπέρα';
}
