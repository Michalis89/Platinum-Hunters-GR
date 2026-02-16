import Link from 'next/link';
import { Gamepad2, Sparkles, BookOpen, Film, Tv, BookText } from 'lucide-react';
import type { CategoryStats, PersonalStats } from './types';
import type { ReactNode } from 'react';

type HeroCategoryKey = 'games' | 'anime' | 'manga' | 'movies' | 'tv' | 'books';

type HeroPreset = {
  key: HeroCategoryKey;
  label: string;
  icon: ReactNode;
  description: string;
  href: string;
};

const CATEGORY_PRESETS: HeroPreset[] = [
  {
    key: 'games',
    label: 'Games',
    icon: <Gamepad2 className="h-5 w-5" />,
    description: 'Jump back into your next level or boss fight.',
    href: '/backlog?category=games&status=current',
  },
  {
    key: 'anime',
    label: 'Anime',
    icon: <Sparkles className="h-5 w-5" />,
    description: 'Pick up the series that kept you up all night.',
    href: '/backlog?category=anime&status=current',
  },
  {
    key: 'manga',
    label: 'Manga',
    icon: <BookOpen className="h-5 w-5" />,
    description: 'Catch up on the chapters waiting for you.',
    href: '/backlog?category=manga&status=current',
  },
  {
    key: 'movies',
    label: 'Movies',
    icon: <Film className="h-5 w-5" />,
    description: 'Queue up your next cinephile binge.',
    href: '/backlog?category=movies&status=planned',
  },
  {
    key: 'tv',
    label: 'TV Shows',
    icon: <Tv className="h-5 w-5" />,
    description: 'Keep your series streak going, one episode at a time.',
    href: '/backlog?category=tv&status=current',
  },
  {
    key: 'books',
    label: 'Books',
    icon: <BookText className="h-5 w-5" />,
    description: 'Return to your bookmark and keep reading.',
    href: '/backlog?category=books&status=current',
  },
];

type HomeHeroActionCardProps = {
  stats?: PersonalStats;
};

export function HomeHeroActionCard({ stats }: HomeHeroActionCardProps) {
  const getCategoryStats = (key: HeroCategoryKey): CategoryStats | undefined =>
    stats ? (stats[key] as CategoryStats) : undefined;

  const recentCategory =
    CATEGORY_PRESETS.find(entry => (getCategoryStats(entry.key)?.in_progress ?? 0) > 0) ??
    CATEGORY_PRESETS.find(entry => stats?.active_categories?.includes(entry.key)) ??
    CATEGORY_PRESETS[0];

  const highlightStat = getCategoryStats(recentCategory.key);
  const playingText =
    highlightStat && highlightStat.in_progress > 0
      ? `In progress now: ${highlightStat.in_progress} ${recentCategory.label.toLowerCase()}`
      : `Add ${recentCategory.label.toLowerCase()} to get started`;
  const totalText =
    highlightStat && highlightStat.total > 0
      ? `Total tracked: ${highlightStat.total}`
      : 'No data yet';
  const lastPlayed =
    highlightStat && highlightStat.hours > 0
      ? `Latest logged time: ${highlightStat.hours} hrs`
      : 'No time logged yet';
  const nextStep =
    highlightStat && highlightStat.in_progress > 0
      ? 'Next step: continue your current item'
      : 'Add something new to your backlog';

  return (
    <section className="px-4 md:px-6">
      <div className="mx-auto max-w-screen-2xl">
        <div className="grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-md md:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
              Next Up
            </p>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Pick up where you left off
            </h2>
            <p className="text-sm text-muted-foreground">{playingText}</p>
            <p className="text-lg font-semibold text-foreground">{recentCategory.label}</p>
            <p className="text-sm text-muted-foreground">{recentCategory.description}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={recentCategory.href}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-foreground transition duration-300 hover:shadow-md hover:brightness-110"
              >
                Continue
                <span aria-hidden="true">-&gt;</span>
              </Link>
              <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="text-primary">{recentCategory.icon}</span>
                Latest backlog focus
              </div>
            </div>
          </div>
          <div className="relative rounded-2xl border border-border bg-gradient-to-br from-primary/30 to-transparent p-4 text-foreground">
            <div className="flex h-full flex-col justify-between gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-black/70 via-black/40 to-transparent p-4 shadow-inner shadow-black/60">
                <div className="flex items-center gap-3 text-white">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
                    {recentCategory.icon}
                  </span>
                  <div>
                    <p className="text-sm uppercase tracking-[0.4em] text-white/60">Thumbnail</p>
                    <p className="text-lg font-semibold text-white">{recentCategory.label}</p>
                    <p className="text-xs text-white/60">{playingText}</p>
                  </div>
                </div>
                <div className="mt-4 h-32 w-full rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-transparent" />
              </div>
              <div className="text-sm text-white/80">
                <p className="text-lg font-bold text-white">{totalText}</p>
                <p className="mt-1 text-xs">{lastPlayed}</p>
                <p className="mt-1 text-xs">{nextStep}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
