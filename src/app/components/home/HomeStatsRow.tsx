'use client';

import {
  ListTodo,
  Play,
  CheckCircle2,
  Clock,
  Gamepad2,
  Sparkles,
  BookMarked,
  Film,
  Tv,
  BookText,
} from 'lucide-react';
import type { ReactNode } from 'react';

type CategoryStats = {
  total: number;
  in_progress: number;
  completed: number;
  hours: number;
};

type PersonalStats = {
  total_backlog: number;
  in_progress: number;
  completed: number;
  total_hours: number;
  games: CategoryStats;
  anime: CategoryStats;
  manga: CategoryStats & { chapters: number };
  movies: CategoryStats;
  tv: CategoryStats;
  books: CategoryStats & { pages: number };
  active_categories: string[];
};

type HomeStatsRowProps = {
  stats?: PersonalStats;
};

type SummaryStatItem = {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
};

type CategoryConfig = {
  key: keyof Pick<PersonalStats, 'games' | 'anime' | 'manga' | 'movies' | 'tv' | 'books'>;
  label: string;
  icon: ReactNode;
  color: string;
  metric: 'hours' | 'chapters' | 'pages';
  metricLabel: string;
};

const categoryConfig: CategoryConfig[] = [
  {
    key: 'games',
    label: 'Games',
    icon: <Gamepad2 className="h-4 w-4" />,
    color: 'text-violet-400',
    metric: 'hours',
    metricLabel: 'ώρες',
  },
  {
    key: 'anime',
    label: 'Anime',
    icon: <Sparkles className="h-4 w-4" />,
    color: 'text-pink-400',
    metric: 'hours',
    metricLabel: 'ώρες',
  },
  {
    key: 'manga',
    label: 'Manga',
    icon: <BookMarked className="h-4 w-4" />,
    color: 'text-orange-400',
    metric: 'chapters',
    metricLabel: 'Volumes',
  },
  {
    key: 'movies',
    label: 'Ταινίες',
    icon: <Film className="h-4 w-4" />,
    color: 'text-red-400',
    metric: 'hours',
    metricLabel: 'ώρες',
  },
  {
    key: 'tv',
    label: 'Σειρές',
    icon: <Tv className="h-4 w-4" />,
    color: 'text-blue-400',
    metric: 'hours',
    metricLabel: 'ώρες',
  },
  {
    key: 'books',
    label: 'Βιβλία',
    icon: <BookText className="h-4 w-4" />,
    color: 'text-emerald-400',
    metric: 'pages',
    metricLabel: 'σελίδες',
  },
];

export function HomeStatsRow({ stats }: HomeStatsRowProps) {
  const summaryStats: SummaryStatItem[] = [
    {
      label: 'Στο Backlog',
      value: stats?.total_backlog ?? '–',
      icon: <ListTodo className="h-5 w-5" />,
      color: 'text-violet-400',
    },
    {
      label: 'Σε εξέλιξη',
      value: stats?.in_progress ?? '–',
      icon: <Play className="h-5 w-5" />,
      color: 'text-emerald-400',
    },
    {
      label: 'Ολοκληρωμένα',
      value: stats?.completed ?? '–',
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: 'text-amber-400',
    },
    {
      label: 'Συνολικές Ώρες',
      value: stats?.total_hours ?? '–',
      icon: <Clock className="h-5 w-5" />,
      color: 'text-sky-400',
    },
  ];

  // Filter to only show active categories
  const activeCategories = stats?.active_categories ?? [];
  const visibleCategories = categoryConfig.filter(cat => activeCategories.includes(cat.key));

  return (
    <section className="space-y-6 px-4 md:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Summary Stats Row */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {summaryStats.map(stat => (
            <div
              key={stat.label}
              className="rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-[var(--hb-muted)]">
                  {stat.label}
                </span>
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <p className="text-2xl font-bold text-[var(--hb-headline)] md:text-3xl">
                {stat.value === '–' || stat.value === undefined ? '–' : stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Category Breakdown - only show if user has categories */}
        {visibleCategories.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-[var(--hb-muted)]">
              Ανά Κατηγορία
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleCategories.map(cat => {
                const catStats = stats?.[cat.key];
                if (!catStats) return null;

                const metricValue =
                  cat.metric === 'chapters'
                    ? (catStats as CategoryStats & { chapters: number }).chapters
                    : cat.metric === 'pages'
                      ? (catStats as CategoryStats & { pages: number }).pages
                      : catStats.hours;

                return (
                  <div
                    key={cat.key}
                    className="hover:border-[var(--hb-primary-strong)]/40 flex items-center gap-4 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4 transition"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 ${cat.color}`}
                    >
                      {cat.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--hb-headline)]">{cat.label}</p>
                      <div className="flex gap-3 text-xs text-[var(--hb-muted)]">
                        <span>{catStats.total} συνολικά</span>
                        <span className="text-emerald-400">{catStats.in_progress} σε εξέλιξη</span>
                        <span className="text-amber-400">{catStats.completed} ✓</span>
                      </div>
                    </div>
                    {metricValue > 0 && (
                      <div className="text-right">
                        <p className="text-lg font-bold text-[var(--hb-headline)]">{metricValue}</p>
                        <p className="text-xs text-[var(--hb-muted)]">{cat.metricLabel}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
