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
  Info,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

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
  if (years > 0) segments.push(pluralize(years, 'year', 'years'));
  if (months > 0) segments.push(pluralize(months, 'month', 'months'));
  if (days > 0) segments.push(pluralize(days, 'day', 'days'));
  if (hours > 0) segments.push(pluralize(hours, 'hour', 'hours'));

  if (segments.length === 0) {
    return '0 hours';
  }

  return segments.join(', ');
};

const categoryConfig: CategoryConfig[] = [
  {
    key: 'games',
    label: 'Games',
    icon: <Gamepad2 className="h-4 w-4" />,
    metric: 'hours',
    metricLabel: 'hours',
  },
  {
    key: 'anime',
    label: 'Anime',
    icon: <Sparkles className="h-4 w-4" />,
    metric: 'hours',
    metricLabel: 'hours',
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
    label: 'Movies',
    icon: <Film className="h-4 w-4" />,
    metric: 'hours',
    metricLabel: 'hours',
  },
  {
    key: 'tv',
    label: 'TV shows',
    icon: <Tv className="h-4 w-4" />,
    metric: 'hours',
    metricLabel: 'hours',
  },
  {
    key: 'books',
    label: 'Books',
    icon: <BookText className="h-4 w-4" />,
    metric: 'pages',
    metricLabel: 'pages',
  },
];

export function HomeStatsRow({ stats, enabledCategories }: HomeStatsRowProps) {
  const summaryStats: SummaryStatItem[] = [
    {
      label: 'Backlog',
      value: stats?.total_backlog ?? '–',
      icon: <ListTodo className="h-4 w-4" />,
    },
    {
      label: 'In progress',
      value: stats?.in_progress ?? '–',
      icon: <Play className="h-4 w-4" />,
    },
    {
      label: 'Completed',
      value: stats?.completed ?? '–',
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    {
      label: 'Total hours',
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
            <article key={stat.label} className="rounded-lg border p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{stat.label}</span>
                {stat.icon}
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
                {stat.value === '–' || stat.value === undefined ? '–' : stat.value}
              </p>
              {stat.label === 'Total hours' && totalHoursDescription && (
                <p className="mt-2 text-xs leading-relaxed">{totalHoursDescription}</p>
              )}
            </article>
          ))}
        </div>

        {visibleCategories.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-medium uppercase opacity-60">By category</h2>
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
                const clampedCompletion = Math.min(Math.max(completionRatio, 0), 100);
                const completionPercent = Math.round(clampedCompletion);

                return (
                  <article key={cat.key} className="rounded-lg border p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <span className="">{cat.icon}</span>
                          {cat.label}
                        </div>
                        <p className="text-xs">Total: {catStats.total}</p>
                      </div>
                      {metricValue > 0 && (
                        <div className="text-right">
                          <p className="text-lg font-semibold tracking-[-0.02em]">{metricValue}</p>
                          <p className="text-xs">{cat.metricLabel}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <p>In progress: {catStats.in_progress}</p>
                      <p>Completed: {catStats.completed}</p>
                      <p>Planned: {planned}</p>
                      <p>Dropped: {dropped}</p>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs">
                      <div className="h-2 flex-1 rounded-full bg-border/40">
                        <div
                          className="h-full rounded-full bg-primary transition-[width] duration-300"
                          style={{
                            width: `${clampedCompletion}%`,
                          }}
                        />
                      </div>
                      <span className="font-medium">{completionPercent}%</span>
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="secondary"
                              aria-label="Completion details"
                              className="hover:bg-primary/10 grid h-7 w-7 place-items-center rounded-full border border-border bg-card text-primary transition hover:border-primary"
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            align="center"
                            sideOffset={8}
                            className="z-[9999] w-[min(280px,80vw)] rounded-2xl border border-border bg-card p-3 text-xs leading-relaxed text-foreground shadow-md"
                          >
                            Percentage of completed entries out of the total, excluding dropped.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
