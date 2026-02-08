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
};

type CategoryConfig = {
  key: keyof Pick<PersonalStats, 'games' | 'anime' | 'manga' | 'movies' | 'tv' | 'books'>;
  label: string;
  icon: ReactNode;
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
    metric: 'hours',
    metricLabel: 'ώρες',
  },
  {
    key: 'anime',
    label: 'Anime',
    icon: <Sparkles className="h-4 w-4" />,
    metric: 'hours',
    metricLabel: 'ώρες',
  },
  {
    key: 'manga',
    label: 'Manga',
    icon: <BookMarked className="h-4 w-4" />,
    metric: 'chapters',
    metricLabel: 'volumes',
  },
  {
    key: 'movies',
    label: 'Ταινίες',
    icon: <Film className="h-4 w-4" />,
    metric: 'hours',
    metricLabel: 'ώρες',
  },
  {
    key: 'tv',
    label: 'Σειρές',
    icon: <Tv className="h-4 w-4" />,
    metric: 'hours',
    metricLabel: 'ώρες',
  },
  {
    key: 'books',
    label: 'Βιβλία',
    icon: <BookText className="h-4 w-4" />,
    metric: 'pages',
    metricLabel: 'σελίδες',
  },
];

export function HomeStatsRow({ stats, enabledCategories }: HomeStatsRowProps) {
  const summaryStats: SummaryStatItem[] = [
    {
      label: 'Στο backlog',
      value: stats?.total_backlog ?? '–',
      icon: <ListTodo className="h-4 w-4" />,
    },
    {
      label: 'Σε εξέλιξη',
      value: stats?.in_progress ?? '–',
      icon: <Play className="h-4 w-4" />,
    },
    {
      label: 'Ολοκληρωμένα',
      value: stats?.completed ?? '–',
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    {
      label: 'Συνολικές ώρες',
      value: stats?.total_hours ?? '–',
      icon: <Clock className="h-4 w-4" />,
    },
  ];

  const totalHoursDescription =
    typeof stats?.total_hours === 'number' ? describeTotalHours(stats.total_hours) : null;

  const activeCategories = stats?.active_categories ?? [];
  const categoryFilter =
    enabledCategories && enabledCategories.length > 0 ? enabledCategories : activeCategories;
  const visibleCategories = categoryConfig.filter(cat => categoryFilter.includes(cat.key));

  return (
    <section className="space-y-8 px-4 md:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {summaryStats.map(stat => (
            <article key={stat.label} className="apple-card p-5">
              <div className="apple-secondary-label flex items-center justify-between">
                <span className="apple-body-tracking text-xs font-medium">{stat.label}</span>
                {stat.icon}
              </div>
              <p className="apple-label mt-3 text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
                {stat.value === '–' || stat.value === undefined ? '–' : stat.value}
              </p>
              {stat.label === 'Συνολικές ώρες' && totalHoursDescription && (
                <p className="apple-secondary-label apple-body-tracking mt-2 text-xs leading-relaxed">{totalHoursDescription}</p>
              )}
            </article>
          ))}
        </div>

        {visibleCategories.length > 0 && (
          <div className="space-y-4">
            <h2 className="apple-secondary-label apple-body-tracking text-sm font-medium uppercase opacity-60">
              Ανά κατηγορία
            </h2>
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
                  <article key={cat.key} className="apple-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="apple-label flex items-center gap-2 text-sm font-semibold">
                          <span className="apple-secondary-label">{cat.icon}</span>
                          {cat.label}
                        </div>
                        <p className="apple-secondary-label text-xs">Σύνολο: {catStats.total}</p>
                      </div>
                      {metricValue > 0 && (
                        <div className="text-right">
                          <p className="apple-label text-lg font-semibold tracking-[-0.02em]">
                            {metricValue}
                          </p>
                          <p className="apple-secondary-label text-xs">{cat.metricLabel}</p>
                        </div>
                      )}
                    </div>

                    <div className="apple-secondary-label mt-4 grid grid-cols-2 gap-2 text-xs">
                      <p>Σε εξέλιξη: {catStats.in_progress}</p>
                      <p>Ολοκληρωμένα: {catStats.completed}</p>
                      <p>Προγραμματισμένα: {planned}</p>
                      <p>Παρατημένα: {dropped}</p>
                    </div>

                    <div className="apple-secondary-label mt-4 flex items-center gap-2 text-xs">
                      <div className="apple-progress-track h-2 flex-1 overflow-hidden rounded-full">
                        <div
                          className="apple-progress-fill h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(completionRatio, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="apple-label font-medium">{completionPercent}%</span>
                      <InfoHint tip="Ποσοστό ολοκληρωμένων εγγραφών σε σχέση με το σύνολο χωρίς dropped." />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
