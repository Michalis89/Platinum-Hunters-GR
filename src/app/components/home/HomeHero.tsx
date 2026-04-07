import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import PageHero from '@/app/components/shared/PageHero';

export function HomeHero() {
  return (
    <PageHero
      eyebrow="Welcome to Hobbistas"
      title={
        <>
          <span className="text-foreground">One place for all</span>
          <br />
          <span className="text-primary">your hobbies.</span>
        </>
      }
      subtitle="Track your anime, games, manga, movies, books, and series in a single app — with recommendations that connect your taste across all of them."
      sectionClassName="px-4 pb-14 pt-14 md:px-6 md:pb-20 md:pt-20"
      titleClassName="mb-5 text-balance text-[2.35rem] font-semibold leading-[1.08] md:text-6xl"
      subtitleClassName=" max-w-[46rem] text-[15px] text-muted-foreground md:text-[1.15rem]"
      actions={
        <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-3 rounded-3xl px-3 py-3 sm:flex-row sm:gap-4 sm:px-4 sm:py-4">
          <Link
            href="/auth/register"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 sm:w-auto"
          >
            <Sparkles className="h-5 w-5" />
            Start for free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/about"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-8 py-3.5 text-sm font-semibold text-foreground transition hover:border-primary/20 hover:bg-accent/10 sm:w-auto"
          >
            How it works
          </Link>
        </div>
      }
      badges={
        <>
          <span className="px-4 py-1.5 text-xs font-medium tracking-[-0.01em]">
            Free to use
          </span>
          <span className="px-4 py-1.5 text-xs font-medium tracking-[-0.01em]">
            Steam import supported
          </span>
          <span className="px-4 py-1.5 text-xs font-medium tracking-[-0.01em]">
            Private by default
          </span>
        </>
      }
    />
  );
}
