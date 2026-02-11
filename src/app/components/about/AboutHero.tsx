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
          <span className="bg-gradient-to-r from-[var(--hb-headline)] via-[var(--hb-text)] to-[var(--hb-muted)] bg-clip-text text-transparent">
            This is not another tracker.
          </span>
          <br />
          <span className="bg-gradient-to-r from-[var(--hb-primary-strong)] via-[var(--hb-primary)] to-[var(--hb-accent)] bg-clip-text text-transparent">
            We built the hobby hub that was missing.
          </span>
        </>
      }
      subtitle="Hobbista keeps every hobby organized with a calm interface. Here is why it exists, how it works, and what comes next."
      sectionClassName="pb-24 pt-16 md:pb-32 md:pt-24"
      titleClassName="mb-6 text-4xl md:text-5xl lg:text-6xl"
      actions={
        <>
          <Link
            href={primaryHref}
            className="group inline-flex items-center gap-2 rounded-full bg-[var(--hb-primary-strong)] px-8 py-3.5 text-base font-semibold text-white transition hover:brightness-110"
          >
            <Sparkles className="h-5 w-5" />
            {primaryLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/pages/hobbies"
            className="hover:border-[var(--hb-primary-strong)]/60 inline-flex items-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-8 py-3.5 text-base font-semibold text-[var(--hb-text)] transition hover:text-[var(--hb-headline)]"
          >
            <Compass className="h-4 w-4" />
            Browse the categories
          </Link>
        </>
      }
      badges={
        <>
          <span className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1">
            Product philosophy
          </span>
          <span className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1">
            Roadmap transparency
          </span>
          <span className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1">
            Community-first
          </span>
        </>
      }
    />
  );
}
