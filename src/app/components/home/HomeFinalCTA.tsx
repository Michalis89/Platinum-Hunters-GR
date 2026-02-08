import Link from 'next/link';
import { ArrowRight, LogIn } from 'lucide-react';

export function HomeFinalCTA() {
  return (
    <section className="relative px-4 pb-8 pt-14 md:px-6 md:pb-12 md:pt-16">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color-mix(in_srgb,var(--apple-system-blue)_4%,transparent)] to-transparent" />

      <div className="apple-material-surface relative mx-auto max-w-3xl rounded-[var(--apple-radius-container)] p-7 text-center md:p-10">
        <h2 className="apple-title-tracking mb-4 text-3xl font-semibold text-[var(--apple-label)] md:text-4xl">
          Έτοιμος να οργανώσεις τα hobbies σου;
        </h2>
        <p className="apple-body-tracking mx-auto mb-8 max-w-xl text-base text-[var(--apple-secondary-label)] md:text-lg">
          Δημιούργησε λογαριασμό και ξεκίνα να παρακολουθείς την πρόοδό σου — games, anime, ταινίες
          και πολλά ακόμα.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/pages/auth/register"
            className="apple-focus-ring group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--apple-system-blue)] px-8 py-3.5 text-sm font-semibold text-white shadow-[var(--hb-shadow-sm)] transition hover:brightness-110 sm:w-auto"
          >
            Δημιούργησε λογαριασμό
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/pages/auth/login"
            className="apple-focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)] px-8 py-3.5 text-sm font-semibold text-[var(--apple-label)] transition hover:border-[color-mix(in_srgb,var(--apple-system-blue)_22%,var(--apple-separator))] hover:bg-[color-mix(in_srgb,var(--apple-tertiary-fill)_65%,var(--apple-material)_35%)] sm:w-auto"
          >
            <LogIn className="h-4 w-4" />
            Έχω ήδη λογαριασμό
          </Link>
        </div>
      </div>
    </section>
  );
}
