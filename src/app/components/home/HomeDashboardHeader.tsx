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
    <section className="px-4 pb-10 pt-12 md:px-6 md:pb-12 md:pt-16">
      <div className="mx-auto max-w-screen-2xl">
        <div className="max-w-4xl space-y-4 md:space-y-5">
          <p
            className="min-h-[1.25rem] text-sm font-medium tracking-normal text-muted-foreground"
            suppressHydrationWarning
          >
            {greeting}
          </p>
          <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight text-foreground md:text-6xl lg:text-[4.25rem]">
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-[hsl(var(--text-primary))] via-[hsl(var(--text-primary))] to-[hsl(var(--text-secondary))] bg-clip-text text-transparent">
              {name}
            </span>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed tracking-normal text-muted-foreground/80">
            Keep your backlog organized, pick up where you left off, and explore community
            recommendations.
          </p>
        </div>
      </div>
    </section>
  );
}

function getGreeting(): string {
  return new Date().getHours() < 12 ? 'Good morning' : 'Good afternoon';
}
