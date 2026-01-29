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
import { InfoHint } from '@/app/components/ui/InfoHint';

type CategoryStats = {
  total: number;
  in_progress: number;
  completed: number;
  dropped: number;
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
  enabledCategories?: string[];
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

const HOURS_PER_DAY = 24;
const DAYS_PER_MONTH = 30;
const MONTHS_PER_YEAR = 12;
const HOURS_PER_MONTH = HOURS_PER_DAY * DAYS_PER_MONTH;
const HOURS_PER_YEAR = HOURS_PER_MONTH * MONTHS_PER_YEAR;

const pluralize = (value: number, singular: string, plural: string) =>
  `${value} ${value === 1 ? singular : plural}`;

const describeTotalHours = (totalHours: number) => {
  const years = Math.floor(totalHours / HOURS_PER_YEAR);
  let remainder = totalHours - years * HOURS_PER_YEAR;
  const months = Math.floor(remainder / HOURS_PER_MONTH);
  remainder -= months * HOURS_PER_MONTH;
  const days = Math.floor(remainder / HOURS_PER_DAY);
  remainder -= days * HOURS_PER_DAY;
  const hours = Math.floor(remainder);

  const segments: string[] = [];
  if (years > 0) segments.push(pluralize(years, 'χρόνος', 'χρόνια'));
  if (months > 0) segments.push(pluralize(months, 'μήνας', 'μήνες'));
  if (days > 0) segments.push(pluralize(days, 'μέρα', 'μέρες'));
  if (hours > 0) segments.push(pluralize(hours, 'ώρα', 'ώρες'));

  if (segments.length === 0) {
    return '0 ώρες';
  }

  return segments.join(', ');
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

export function HomeStatsRow({ stats, enabledCategories }: HomeStatsRowProps) {
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

  const totalHoursDescription =
    typeof stats?.total_hours === 'number' ? describeTotalHours(stats.total_hours) : null;

  // Filter to only show active categories
  const activeCategories = stats?.active_categories ?? [];
  const categoryFilter =
    enabledCategories && enabledCategories.length > 0 ? enabledCategories : activeCategories;
  const visibleCategories = categoryConfig.filter(cat => categoryFilter.includes(cat.key));

  return (
    <section className="space-y-6 px-4 md:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Summary Stats Row */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {summaryStats.map(stat => {
            const isPrimary = stat.label === 'Στο Backlog';
            return (
              <div
                key={stat.label}
                className={`rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-5 shadow-sm transition ${
                  isPrimary ? 'shadow-[var(--hb-shadow-md)] ring-1 ring-red-500/20' : ''
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.4em] text-[var(--hb-muted)]">
                    {stat.label}
                  </span>
                  <span className={stat.color}>{stat.icon}</span>
                </div>
                <p
                  className={`font-bold text-[var(--hb-headline)] ${
                    isPrimary ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'
                  }`}
                >
                  {stat.value === '–' || stat.value === undefined ? '–' : stat.value}
                </p>
                {stat.label === 'Συνολικές Ώρες' && totalHoursDescription && (
                  <div className="bg-[var(--hb-card)]/70 mt-2 inline-flex cursor-default items-center gap-1.5 rounded-full border border-[var(--hb-border)] px-3 py-1 text-[11px] font-medium leading-none text-[var(--hb-muted)] transition hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-[var(--hb-text)]">
                    <Clock className="h-3 w-3 opacity-70" />
                    {totalHoursDescription}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Category Breakdown - only show if user has categories */}
        {visibleCategories.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-[var(--hb-muted)]">
              Ανά Κατηγορία
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleCategories.map(cat => {
                const catStats = stats?.[cat.key];
                if (!catStats) return null;

                const metricValue =
                  cat.metric === 'chapters'
                    ? (catStats as CategoryStats & { chapters: number }).chapters
                    : cat.metric === 'pages'
                      ? (catStats as CategoryStats & { pages: number }).pages
                      : catStats.hours;

                const dropped = catStats.dropped ?? 0;
                const planned = Math.max(
                  catStats.total - catStats.in_progress - catStats.completed - dropped,
                  0,
                );
                const completionBase = Math.max(catStats.total - dropped, 0);
                const completionRatio =
                  completionBase > 0 ? (catStats.completed / completionBase) * 100 : 0;
                const completionPercent = Math.round(completionRatio);

                return (
                  <div
                    key={cat.key}
                    className="hover:border-[var(--hb-primary-strong)]/40 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-5 shadow-sm transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--hb-headline)]">
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ${cat.color}`}
                        >
                          {cat.icon}
                        </span>
                        {cat.label}
                      </div>
                      {metricValue > 0 && (
                        <div className="text-right text-xs text-[var(--hb-muted)]">
                          <p className="text-base font-semibold text-[var(--hb-headline)]">
                            {metricValue}
                          </p>
                          <p>{cat.metricLabel}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-slate-500 dark:text-[var(--hb-muted)]">
                      {/* Total */}
                      <p className="text-slate-500 dark:text-[var(--hb-muted)]">
                        Σύνολο: {catStats.total}
                      </p>

                      {/* In Progress (softer red) */}
                      <p className="text-rose-500 dark:text-[var(--hb-primary-strong)]">
                        Σε εξέλιξη: {catStats.in_progress}
                      </p>

                      {/* Completed (premium emerald) */}
                      <p className="text-emerald-500 dark:text-emerald-400">
                        Ολοκληρωμένα: {catStats.completed}
                      </p>

                      {/* Planned (lighter + quieter) */}
                      <p className="text-slate-500 dark:text-slate-400">
                        Προγραμματισμένα: {planned}
                      </p>

                      {/* Dropped (amber instead of red) */}
                      <p className="text-amber-500 dark:text-rose-400">Παρατημένα: {dropped}</p>
                    </div>

                    <div className="mt-3 flex items-center gap-3 text-xs text-[var(--hb-muted)]">
                      <div className="flex-1">
                        <div className="h-2.5 rounded-full bg-gradient-to-r from-slate-200/70 via-slate-200/50 to-slate-200/60 dark:from-white/10 dark:to-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#ef4444] via-[#f87171] to-[#b91c1c] transition-all dark:bg-gradient-to-r dark:from-[var(--hb-primary-strong)] dark:to-[var(--hb-primary-strong)]"
                            style={{
                              width: `${Math.min(completionRatio, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <span className="font-semibold text-[var(--hb-headline)]">
                          {completionPercent}% σε ολοκληρωμένα
                        </span>
                        <InfoHint tip="Η μπάρα δείχνει το ποσοστό ολοκληρωμένων εγγραφών σε σχέση με το σύνολο (συνολικά μείον dropped)." />
                      </div>
                    </div>
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
