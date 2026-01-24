import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import PageHero from '@/app/components/layout/PageHero';

export function HomeHero() {
  return (
    <PageHero
      eyebrow="Καλωσόρισες στον Χομπίστα"
      title={
        <>
          <span className="bg-gradient-to-r from-[var(--hb-headline)] via-[var(--hb-text)] to-[var(--hb-muted)] bg-clip-text text-transparent">
            Όλα τα hobbies σου.
          </span>
          <br />
          <span className="bg-gradient-to-r from-[var(--hb-primary-strong)] via-[var(--hb-primary)] to-[var(--hb-accent)] bg-clip-text text-transparent">
            Μία πλατφόρμα.
          </span>
        </>
      }
      subtitle="Οργάνωσε gaming, anime, manga, ταινίες, σειρές και βιβλία — backlog, πρόοδος, σημειώσεις, στατιστικά. Όλα σε ένα καθαρό, μινιμαλιστικό περιβάλλον."
      sectionClassName="pb-20 pt-16 md:pb-28 md:pt-24"
      titleClassName="mb-6 text-4xl md:text-5xl lg:text-6xl"
      actions={
        <>
          <Link
            href="/pages/auth/register"
            className="group inline-flex items-center gap-2 rounded-full bg-[var(--hb-primary-strong)] px-8 py-3.5 text-base font-semibold text-white transition hover:brightness-110"
          >
            <Sparkles className="h-5 w-5" />
            Ξεκίνα τώρα
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/pages/hobbies"
            className="hover:border-[var(--hb-primary-strong)]/60 inline-flex items-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-8 py-3.5 text-base font-semibold text-[var(--hb-text)] transition hover:text-[var(--hb-headline)]"
          >
            Εξερεύνησε τα hobbies
          </Link>
        </>
      }
    />
  );
}
