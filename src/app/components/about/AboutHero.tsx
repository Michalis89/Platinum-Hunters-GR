import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export function AboutHero() {
  return (
    <section className="relative px-4 pb-24 pt-16 md:px-6 md:pb-32 md:pt-24">
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[var(--hb-primary-strong)]">
          Το προσωπικό σου hobby hub
        </p>

        <h1 className="mb-6 bg-gradient-to-r from-[var(--hb-headline)] via-[var(--hb-text)] to-[var(--hb-muted)] bg-clip-text text-4xl font-extrabold leading-tight text-transparent md:text-5xl lg:text-6xl">
          Όλα τα hobbies σου.
          <br />
          <span className="bg-gradient-to-r from-[var(--hb-primary-strong)] via-[var(--hb-primary)] to-[var(--hb-accent)] bg-clip-text">
            Μία πλατφόρμα.
          </span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-[var(--hb-muted)] md:text-xl">
          Ο Χομπίστας είναι ο χώρος για να οργανώνεις, παρακολουθείς και
          απολαμβάνεις τα gaming, anime, manga, ταινίες, σειρές και βιβλία σου —
          όλα σε ένα καθαρό, μινιμαλιστικό περιβάλλον.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/pages/auth/register"
            className="group inline-flex items-center gap-2 rounded-full bg-[var(--hb-primary-strong)] px-8 py-3.5 text-base font-semibold text-white transition hover:brightness-110"
          >
            <Sparkles className="h-5 w-5" />
            Ξεκίνα δωρεάν
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/pages/hobbies"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-8 py-3.5 text-base font-semibold text-[var(--hb-text)] transition hover:border-[var(--hb-primary-strong)]/60 hover:text-[var(--hb-headline)]"
          >
            Εξερεύνησε τα hobbies
          </Link>
        </div>
      </div>
    </section>
  );
}
