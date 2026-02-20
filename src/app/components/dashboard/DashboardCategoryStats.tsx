'use client';

import { CheckCircle2, Gamepad2, Heart, ListTodo, Play, Sparkles, Tv, XCircle } from 'lucide-react';
import type { DashboardCategoryKey } from '@/lib/dashboard/category-data';
import {
  DASH_RADIUS_CARD,
  DASH_SURFACE_CARD,
  DASH_SURFACE_CARD_ELEVATED,
} from './dashboard-ui-tokens';
import DashboardSectionHeader from './DashboardSectionHeader';

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
  games: { eyebrow: 'Your Games', title: 'Your game progress' },
  anime: { eyebrow: 'Your Anime', title: 'Your anime progress' },
  manga: { eyebrow: 'Your Manga', title: 'Your manga progress' },
  movies: { eyebrow: 'Your Movies', title: 'Your movie progress' },
  tv: { eyebrow: 'Your Series', title: 'Your series progress' },
  books: { eyebrow: 'Your Books', title: 'Your reading progress' },
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

  return `${years} years, ${months} months, ${days} days, ${hours} hours`;
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
    { key: 'hours', label: 'Total hours', value: stats.hours, icon: Sparkles },
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
        className={`${DASH_RADIUS_CARD} min-w-0 border border-black/[0.06] p-5 text-center dark:border-white/[0.06] ${
          isPrimary
            ? `${DASH_SURFACE_CARD_ELEVATED} shadow-[0_10px_30px_-24px_rgba(0,0,0,0.75)]`
            : `${DASH_SURFACE_CARD} shadow-none`
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
      <DashboardSectionHeader
        eyebrow={labels.eyebrow}
        title={labels.title}
        rightSlot={
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
            {stats.total} entries
          </span>
        }
      />

      <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {primaryStats.map(renderCard)}
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-3 pt-1 md:grid-cols-4 md:gap-3.5">
        {secondaryStats.map(renderCard)}
      </div>
    </section>
  );
}
