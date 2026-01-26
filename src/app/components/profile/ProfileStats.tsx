'use client';

import {
  Trophy,
  CheckCircle2,
  Gamepad2,
  Clock,
  ListTodo,
  XCircle,
  Play,
  Sparkles,
  BookOpen,
  Film,
  Tv,
  Heart,
  Eye,
} from 'lucide-react';
import type { ReactNode } from 'react';

type Stat = {
  value: number | string;
  label: string;
  icon: ReactNode;
  note?: string;
};

type MediaStats = {
  total?: number;
  completed?: number;
  current?: number;
  planned?: number;
  dropped?: number;
  favorites?: number;
};

type ProfileStatsProps = {
  category: string;
  gamingStats?: {
    platinumed?: number;
    completed?: number;
    playing?: number;
    to_play?: number;
    Dropped?: number;
  };
  totalHours?: number;
  mediaStats?: MediaStats;
};

const categoryTitles: Record<string, { eyebrow: string; title: string }> = {
  gaming: { eyebrow: 'Gaming Stats', title: 'Η πορεία σου στα games' },
  anime: { eyebrow: 'Anime Stats', title: 'Η πορεία σου στα anime' },
  manga: { eyebrow: 'Manga Stats', title: 'Η πορεία σου στα manga' },
  movies: { eyebrow: 'Movies Stats', title: 'Η πορεία σου στις ταινίες' },
  tv: { eyebrow: 'TV Stats', title: 'Η πορεία σου στις σειρές' },
  books: { eyebrow: 'Books Stats', title: 'Η πορεία σου στα βιβλία' },
};

const categoryIcons: Record<string, ReactNode> = {
  gaming: <Gamepad2 className="h-5 w-5" />,
  anime: <Sparkles className="h-5 w-5" />,
  manga: <BookOpen className="h-5 w-5" />,
  movies: <Film className="h-5 w-5" />,
  tv: <Tv className="h-5 w-5" />,
  books: <BookOpen className="h-5 w-5" />,
};

export function ProfileStats({
  category,
  gamingStats,
  totalHours = 0,
  mediaStats,
}: Readonly<ProfileStatsProps>) {
  const titles = categoryTitles[category] || { eyebrow: 'Stats', title: 'Τα στατιστικά σου' };

  // Gaming-specific stats
  const getGamingStats = (): Stat[] => [
    {
      value: gamingStats?.platinumed || 0,
      label: 'Πλατίνες',
      icon: <Trophy className="h-5 w-5" />,
      note: 'trophies',
    },
    {
      value: gamingStats?.completed || 0,
      label: 'Ολοκληρωμένα',
      icon: <CheckCircle2 className="h-5 w-5" />,
      note: 'games',
    },
    {
      value: gamingStats?.playing || 0,
      label: 'Παίζω τώρα',
      icon: <Gamepad2 className="h-5 w-5" />,
      note: 'active',
    },
    {
      value: gamingStats?.to_play || 0,
      label: 'Backlog',
      icon: <ListTodo className="h-5 w-5" />,
      note: 'queued',
    },
    {
      value: gamingStats?.Dropped || 0,
      label: 'Παρατημένα',
      icon: <XCircle className="h-5 w-5" />,
      note: 'dropped',
    },
    {
      value: totalHours,
      label: 'Ώρες παιχνιδιού',
      icon: <Clock className="h-5 w-5" />,
      note: 'hours',
    },
  ];

  // Media stats (anime, manga, movies, tv, books)
  const getMediaStats = (): Stat[] => {
    const labels: Record<string, { completed: string; current: string; planned: string }> = {
      anime: { completed: 'Ολοκληρωμένα', current: 'Βλέπω τώρα', planned: 'Watchlist' },
      manga: { completed: 'Ολοκληρωμένα', current: 'Διαβάζω τώρα', planned: 'Reading List' },
      movies: { completed: 'Είδα', current: 'Βλέπω', planned: 'Watchlist' },
      tv: { completed: 'Ολοκληρωμένα', current: 'Βλέπω τώρα', planned: 'Watchlist' },
      books: { completed: 'Διάβασα', current: 'Διαβάζω', planned: 'Reading List' },
    };
    const catLabels = labels[category] || {
      completed: 'Ολοκληρωμένα',
      current: 'Τρέχον',
      planned: 'Λίστα',
    };

    return [
      {
        value: mediaStats?.total || 0,
        label: 'Σύνολο',
        icon: categoryIcons[category] || <Eye className="h-5 w-5" />,
        note: 'total',
      },
      {
        value: mediaStats?.completed || 0,
        label: catLabels.completed,
        icon: <CheckCircle2 className="h-5 w-5" />,
        note: 'done',
      },
      {
        value: mediaStats?.current || 0,
        label: catLabels.current,
        icon: <Play className="h-5 w-5" />,
        note: 'active',
      },
      {
        value: mediaStats?.planned || 0,
        label: catLabels.planned,
        icon: <ListTodo className="h-5 w-5" />,
        note: 'queued',
      },
      {
        value: mediaStats?.dropped || 0,
        label: 'Παρατημένα',
        icon: <XCircle className="h-5 w-5" />,
        note: 'dropped',
      },
      {
        value: mediaStats?.favorites || 0,
        label: 'Favorites',
        icon: <Heart className="h-5 w-5" />,
        note: 'loved',
      },
    ];
  };

  const stats = category === 'gaming' ? getGamingStats() : getMediaStats();

  return (
    <section className="relative px-4 py-16 md:px-6 md:py-20">
      {/* Subtle gradient background like AboutStats */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--hb-bg)] via-[var(--hb-primary-strong)]/[0.03] to-[var(--hb-bg)]" />

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--hb-primary-strong)]">
            {titles.eyebrow}
          </p>
          <h2 className="text-2xl font-bold text-[var(--hb-headline)] md:text-3xl">
            {titles.title}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-5 text-center shadow-[0_12px_30px_rgba(3,7,18,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--hb-primary-strong)]/40 hover:shadow-[0_20px_50px_rgba(229,9,20,0.1)]"
            >
              {/* Icon */}
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--hb-primary-strong)]/10 text-[var(--hb-primary-strong)] transition-colors group-hover:bg-[var(--hb-primary-strong)]/20">
                {stat.icon}
              </div>

              {/* Value with gradient */}
              <p className="mb-1 bg-gradient-to-r from-[var(--hb-primary-strong)] to-[var(--hb-accent)] bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">
                {stat.value}
              </p>

              {/* Label */}
              <p className="text-sm font-medium text-[var(--hb-headline)]">{stat.label}</p>

              {/* Note */}
              {stat.note && (
                <p className="mt-1 text-xs text-[var(--hb-muted)]">{stat.note}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
