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

  const primaryStats = [
    { key: 'total', label: 'Total', value: stats.total, icon: CategoryIcon },
    { key: 'completed', label: 'Completed', value: stats.completed, icon: CheckCircle2 },
    { key: 'dropped', label: 'Dropped', value: stats.dropped, icon: XCircle },
  ];
  const secondaryStats = [
    { key: 'planned', label: 'Backlog', value: stats.planned, icon: ListTodo },
    { key: 'current', label: 'Current', value: stats.current, icon: Play },
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
    const isPrimary = primaryStats.some(primaryCard => primaryCard.key === card.key);

    return (
      <article
        key={card.key}
        className={`rounded-xl border p-4 text-center ${
          isPrimary
            ? 'border-border/45 bg-card/90 shadow-[0_8px_26px_-22px_rgba(0,0,0,0.85)] md:p-5'
            : 'border-border/35 bg-card/70'
        }`}
      >
        <div
          className={`mx-auto mb-2 flex items-center justify-center rounded-lg text-primary ${
            isPrimary ? 'h-10 w-10 bg-muted/20' : 'h-8 w-8 bg-muted/15'
          }`}
        >
          <Icon className={isPrimary ? 'h-5 w-5' : 'h-4 w-4'} />
        </div>
        <p
          className={`leading-tight tracking-tight text-foreground ${
            isPrimary ? 'text-3xl font-semibold md:text-[2rem]' : 'text-2xl font-semibold'
          }`}
        >
          {card.value}
        </p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/90">
          {card.label}
        </p>
        {showHoursBreakdown && (
          <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground/80">
            {formatHoursBreakdown(Number(card.value))}
          </p>
        )}
      </article>
    );
  };

  return (
    <section className="space-y-6">
      <div className="space-y-1.5 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/85">
          {labels.eyebrow}
        </p>
        <h3 className="text-2xl font-semibold tracking-tight">{labels.title}</h3>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">{primaryStats.map(renderCard)}</div>
      <div className="grid grid-cols-2 gap-3 pt-1 md:grid-cols-4 md:gap-3.5">
        {secondaryStats.map(renderCard)}
      </div>
    </section>
  );
}
