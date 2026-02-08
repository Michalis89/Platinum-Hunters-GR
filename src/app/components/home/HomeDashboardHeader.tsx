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
    <section className="px-4 pb-8 pt-12 md:px-6 md:pb-8 md:pt-16">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl space-y-4">
          <p
            className="apple-secondary-label apple-body-tracking min-h-[1.25rem] text-sm font-medium"
            suppressHydrationWarning
          >
            {greeting}
          </p>
          <h1 className="apple-label apple-title-tracking text-4xl font-semibold leading-[1.05] md:text-5xl">
            Καλωσόρισες,{' '}
            <span className="bg-gradient-to-r from-[var(--apple-label)] via-[var(--apple-label)] to-[var(--apple-secondary-label)] bg-clip-text text-transparent">
              {name}
            </span>
          </h1>
          <p className="apple-secondary-label apple-body-tracking max-w-2xl text-base leading-relaxed">
            Οργάνωσε το backlog σου, συνέχισε ό,τι έχεις ξεκινήσει και δες τι προτείνει η κοινότητα.
          </p>
        </div>
      </div>
    </section>
  );
}

function getGreeting(): string {
  return new Date().getHours() < 12 ? 'Καλημέρα' : 'Καλησπέρα';
}
