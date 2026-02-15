'use client';

import { CheckCircle2, Gamepad2, Heart, ListTodo, Play, Sparkles, Tv, XCircle } from 'lucide-react';
import type { DashboardCategoryKey } from '@/lib/dashboard/category-data';

type DashboardCategoryStatsData = {
  total: number;
  completed: number;
  current: number;
  planned: number;
  dropped: number;
  favorites: number;
  hours: number;
};

type DashboardCategoryStatsProps = {
  category: DashboardCategoryKey;
  stats: DashboardCategoryStatsData;
};

const TITLES: Record<DashboardCategoryKey, { eyebrow: string; title: string }> = {
  games: { eyebrow: 'Gaming Stats', title: 'Your progress in games' },
  anime: { eyebrow: 'Anime Stats', title: 'Your progress in anime' },
  manga: { eyebrow: 'Manga Stats', title: 'Your progress in manga' },
  movies: { eyebrow: 'Movies Stats', title: 'Your progress in movies' },
  tv: { eyebrow: 'TV Stats', title: 'Your progress in series' },
  books: { eyebrow: 'Books Stats', title: 'Your progress in books' },
};

const CATEGORY_ICONS = {
  games: Gamepad2,
  anime: Sparkles,
  manga: Sparkles,
  movies: Sparkles,
  tv: Tv,
  books: Sparkles,
} as const;

function formatHoursBreakdown(totalHours: number): string {
  const safeHours = Math.max(0, Math.floor(totalHours));
  const hoursPerDay = 24;
  const hoursPerMonth = 30 * hoursPerDay;
  const hoursPerYear = 365 * hoursPerDay;

  const years = Math.floor(safeHours / hoursPerYear);
  let remainder = safeHours % hoursPerYear;
  const months = Math.floor(remainder / hoursPerMonth);
  remainder %= hoursPerMonth;
  const days = Math.floor(remainder / hoursPerDay);
  const hours = remainder % hoursPerDay;

  return `${years} χρόνια, ${months} μήνες, ${days} μέρες, ${hours} ώρες`;
}

export default function DashboardCategoryStats({ category, stats }: DashboardCategoryStatsProps) {
  const labels = TITLES[category];
  const CategoryIcon = CATEGORY_ICONS[category] ?? Sparkles;

  const rowOne = [
    { key: 'total', label: 'Total', value: stats.total, icon: CategoryIcon },
    { key: 'planned', label: 'Backlog', value: stats.planned, icon: ListTodo },
    { key: 'current', label: 'Current', value: stats.current, icon: Play },
    { key: 'dropped', label: 'Dropped', value: stats.dropped, icon: XCircle },
  ];
  const rowTwo = [
    { key: 'completed', label: 'Completed', value: stats.completed, icon: CheckCircle2 },
    { key: 'favorites', label: 'Favorites', value: stats.favorites, icon: Heart },
    { key: 'hours', label: 'Συνολικές ώρες', value: stats.hours, icon: Sparkles },
  ];

  const renderCard = (card: {
    key: string;
    label: string;
    value: number;
    icon: typeof Sparkles;
  }) => {
    const Icon = card.icon;
    const showHoursBreakdown = card.key === 'hours';
    return (
      <article key={card.key} className="rounded-xl border bg-card p-3 text-center">
        <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-card text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xl font-semibold leading-tight">{card.value}</p>
        <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
        {showHoursBreakdown && (
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            {formatHoursBreakdown(Number(card.value))}
          </p>
        )}
      </article>
    );
  };

  return (
    <section className="space-y-4">
      <div className="space-y-1 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {labels.eyebrow}
        </p>
        <h3 className="text-xl font-semibold tracking-tight">{labels.title}</h3>
      </div>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">{rowOne.map(renderCard)}</div>
      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-2.5 md:grid-cols-3">
        {rowTwo.map(renderCard)}
      </div>
    </section>
  );
}
