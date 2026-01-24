import Link from 'next/link';
import { ArrowRight, LogIn } from 'lucide-react';

export function HomeFinalCTA() {
  return (
    <section className="relative px-4 py-16 md:px-6 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--hb-primary-strong)]/[0.04] to-transparent" />

      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="mb-4 text-3xl font-bold text-[var(--hb-headline)] md:text-4xl">
          Έτοιμος να οργανώσεις τα hobbies σου;
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-lg text-[var(--hb-muted)]">
          Δημιούργησε λογαριασμό και ξεκίνα να παρακολουθείς την πρόοδό σου —
          games, anime, ταινίες και πολλά ακόμα.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/pages/auth/register"
            className="group inline-flex items-center gap-2 rounded-full bg-[var(--hb-primary-strong)] px-8 py-3.5 text-base font-semibold text-white transition hover:brightness-110"
          >
            Δημιούργησε λογαριασμό
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/pages/auth/login"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-8 py-3.5 text-base font-semibold text-[var(--hb-text)] transition hover:border-[var(--hb-primary-strong)]/60 hover:text-[var(--hb-headline)]"
          >
            <LogIn className="h-4 w-4" />
            Έχω ήδη λογαριασμό
          </Link>
        </div>

        <p className="mt-8 text-sm text-[var(--hb-muted)]">
          Δωρεάν για πάντα. Χωρίς spam. Μόνο hobbies.
        </p>
      </div>
    </section>
  );
}
