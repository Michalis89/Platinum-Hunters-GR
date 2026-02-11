import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import PageHero from '@/app/components/shared/PageHero';

export function HomeHero() {
  return (
    <PageHero
      eyebrow="Welcome to Hobbistas"
      title={
        <>
          <span className="apple-title-tracking text-[var(--apple-label)]">Your hobbies.</span>
          <br />
          <span className="apple-title-tracking text-[var(--apple-system-blue)]">
            Your space.
          </span>
        </>
      }
      subtitle="Track games, anime, manga, movies, series, and books. Update progress, add notes, and see your stats—all in one place."
      sectionClassName="px-4 pb-14 pt-14 md:px-6 md:pb-20 md:pt-20"
      titleClassName="mb-5 text-balance text-[2.35rem] font-semibold leading-[1.08] md:text-6xl"
      subtitleClassName="apple-body-tracking max-w-[46rem] text-[15px] text-[var(--apple-secondary-label)] md:text-[1.15rem]"
      actions={
        <div className="apple-material-surface mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-3 rounded-[28px] px-3 py-3 sm:flex-row sm:gap-4 sm:px-4 sm:py-4">
          <Link
            href="/auth/register"
            className="apple-focus-ring group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--apple-system-blue)] px-8 py-3.5 text-sm font-semibold text-white shadow-[var(--hb-shadow-sm)] transition hover:brightness-110 sm:w-auto"
          >
            <Sparkles className="h-5 w-5" />
            Start now
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/pages/backlog"
            className="apple-focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)] px-8 py-3.5 text-sm font-semibold text-[var(--apple-label)] transition hover:border-[color-mix(in_srgb,var(--apple-system-blue)_22%,var(--apple-separator))] hover:bg-[color-mix(in_srgb,var(--apple-tertiary-fill)_65%,var(--apple-material)_35%)] sm:w-auto"
          >
            Browse backlog
          </Link>
        </div>
      }
      badges={
        <>
          <span className="apple-pill px-4 py-1.5 text-xs font-medium tracking-[-0.01em]">
            6 media types supported
          </span>
          <span className="apple-pill px-4 py-1.5 text-xs font-medium tracking-[-0.01em]">
            Steam & MAL import
          </span>
          <span className="apple-pill px-4 py-1.5 text-xs font-medium tracking-[-0.01em]">
            Private by default
          </span>
        </>
      }
    />
  );
}
