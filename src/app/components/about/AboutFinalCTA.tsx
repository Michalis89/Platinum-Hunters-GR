import Link from 'next/link';
import { ArrowRight, Mail } from 'lucide-react';

type AboutFinalCTAProps = {
  isAuthenticated?: boolean;
};

export function AboutFinalCTA({ isAuthenticated = false }: AboutFinalCTAProps) {
  const primaryHref = isAuthenticated ? '/dashboard' : '/auth/register';
  const primaryLabel = isAuthenticated ? 'Go to Dashboard' : 'Create an account';

  return (
    <section className="relative px-4 py-20 md:px-6 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/[0.04] to-transparent" />

      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Try it yourself</h2>
        <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
          If this sounds like the kind of tool you&apos;ve been looking for, create an account and
          see if it fits.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={primaryHref}
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-white transition hover:brightness-110"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/support"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-8 py-3.5 text-base font-semibold text-foreground transition hover:border-primary/60 hover:text-foreground"
          >
            <Mail className="h-4 w-4" />
            Contact us
          </Link>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">No credit card. No spam. Just hobbies.</p>
      </div>
    </section>
  );
}
