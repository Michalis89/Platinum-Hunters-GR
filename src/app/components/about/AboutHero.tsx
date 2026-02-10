import Link from 'next/link';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import PageHero from '@/app/components/shared/PageHero';

type AboutHeroProps = {
  isAuthenticated?: boolean;
};

export function AboutHero({ isAuthenticated = false }: AboutHeroProps) {
  const primaryHref = isAuthenticated ? '/dashboard' : '/auth/register';
  const primaryLabel = isAuthenticated ? 'Πήγαινε στο Dashboard' : 'Ξεκίνα δωρεάν';

  return (
    <PageHero
      eyebrow="Σχετικά με τον Hobbistas"
      title={
        <>
          <span className="bg-gradient-to-r from-[var(--hb-headline)] via-[var(--hb-text)] to-[var(--hb-muted)] bg-clip-text text-transparent">
            Δεν φτιάξαμε άλλο ένα tracker.
          </span>
          <br />
          <span className="bg-gradient-to-r from-[var(--hb-primary-strong)] via-[var(--hb-primary)] to-[var(--hb-accent)] bg-clip-text text-transparent">
            Φτιάξαμε το hobby hub που έλειπε.
          </span>
        </>
      }
      subtitle="Ο στόχος του Hobbista είναι να κρατάς όλα τα hobbies σου οργανωμένα, χωρίς θόρυβο και χωρίς χαοτικό UI. Εδώ εξηγούμε το γιατί, το πώς, και τι έρχεται στη συνέχεια."
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
            Δες τις κατηγορίες
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
