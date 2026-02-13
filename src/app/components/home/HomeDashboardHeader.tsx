'use client';

import { useState, useEffect } from 'react';

type HomeDashboardHeaderProps = {
  username: string;
  displayName?: string | null;
};

function useGreeting() {
  const [greeting, setGreeting] = useState<string>('Hello');

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
            className="text-muted-foreground min-h-[1.25rem] text-sm font-medium tracking-normal"
            suppressHydrationWarning
          >
            {greeting}
          </p>
          <h1 className="text-foreground text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-[hsl(var(--text-primary))] via-[hsl(var(--text-primary))] to-[hsl(var(--text-secondary))] bg-clip-text text-transparent">
              {name}
            </span>
          </h1>
          <p className="text-muted-foreground max-w-2xl text-base leading-relaxed tracking-normal">
            Keep your backlog organized, pick up where you left off, and explore community recommendations.
          </p>
        </div>
      </div>
    </section>
  );
}

function getGreeting(): string {
  return new Date().getHours() < 12 ? 'Good morning' : 'Good afternoon';
}
