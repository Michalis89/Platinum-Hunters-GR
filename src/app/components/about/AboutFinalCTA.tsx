import Link from 'next/link';
import { ArrowRight, Mail } from 'lucide-react';

export function AboutFinalCTA() {
  return (
    <section className="relative px-4 py-20 md:px-6 md:py-28">
      <div className="from-[var(--hb-primary-strong)]/[0.04] pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent" />

      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="mb-4 text-3xl font-bold text-[var(--hb-headline)] md:text-4xl">
          Έτοιμος να οργανώσεις τα hobbies σου;
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-lg text-[var(--hb-muted)]">
          Ξεκίνα δωρεάν, χωρίς δεσμεύσεις. Δημιούργησε το backlog σου, κράτα την πρόοδό σου, και
          απόλαυσε τα αγαπημένα σου hobbies χωρίς χάος.
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
            href="#"
            className="hover:border-[var(--hb-primary-strong)]/60 inline-flex items-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-8 py-3.5 text-base font-semibold text-[var(--hb-text)] transition hover:text-[var(--hb-headline)]"
          >
            <Mail className="h-4 w-4" />
            Επικοινώνησε μαζί μας
          </Link>
        </div>

        <p className="mt-8 text-sm text-[var(--hb-muted)]">
          Χωρίς πιστωτική κάρτα. Χωρίς spam. Μόνο hobbies.
        </p>
      </div>
    </section>
  );
}
