import Link from 'next/link';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import PageHero from '@/app/components/shared/PageHero';

type AboutHeroProps = {
  isAuthenticated?: boolean;
};

export function AboutHero({ isAuthenticated = false }: AboutHeroProps) {
  const primaryHref = isAuthenticated ? '/dashboard' : '/auth/register';
  const primaryLabel = isAuthenticated ? 'Go to Dashboard' : 'Start for free';

  return (
    <PageHero
      eyebrow="About Hobbistas"
      title={
        <>
          <span className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
            Not a catalog. Not a feed.
          </span>
          <br />
          <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            A personal space for your hobbies.
          </span>
        </>
      }
      subtitle="Hobbistas is a modular tracking system built for privacy, clarity, and control. Here's why it exists, how it works, and what makes it different."
      sectionClassName="pb-24 pt-16 md:pb-32 md:pt-24"
      titleClassName="mb-6 text-4xl md:text-5xl lg:text-6xl"
      actions={
        <>
          <Link
            href={primaryHref}
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-white transition hover:brightness-110"
          >
            <Sparkles className="h-5 w-5" />
            {primaryLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/pages/hobbies"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-8 py-3.5 text-base font-semibold text-foreground transition hover:border-primary/60 hover:text-foreground"
          >
            <Compass className="h-4 w-4" />
            Browse the categories
          </Link>
        </>
      }
      badges={
        <>
          <span className="rounded-full border border-border bg-card px-3 py-1">
            Personal-first design
          </span>
          <span className="rounded-full border border-border bg-card px-3 py-1">
            Modular by choice
          </span>
          <span className="rounded-full border border-border bg-card px-3 py-1">
            Built in public
          </span>
        </>
      }
    />
  );
}
