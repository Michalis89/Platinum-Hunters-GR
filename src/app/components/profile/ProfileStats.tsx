'use client';

import {
  CheckCircle2,
  Gamepad2,
  ListTodo,
  XCircle,
  Play,
  Sparkles,
  BookOpen,
  Film,
  Tv,
  Heart,
  Eye,
  Clock,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { InfoHint } from '@/app/components/ui/InfoHint';

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
  totalTime?: number;
};

type ProfileStatsProps = {
  category: string;
  mediaStats?: MediaStats;
};

const categoryTitles: Record<string, { eyebrow: string; title: string }> = {
  games: { eyebrow: 'Gaming Stats', title: 'Η πορεία σου στα games' },
  anime: { eyebrow: 'Anime Stats', title: 'Η πορεία σου στα anime' },
  manga: { eyebrow: 'Manga Stats', title: 'Η πορεία σου στα manga' },
  movies: { eyebrow: 'Movies Stats', title: 'Η πορεία σου στις ταινίες' },
  tv: { eyebrow: 'TV Stats', title: 'Η πορεία σου στις σειρές' },
  books: { eyebrow: 'Books Stats', title: 'Η πορεία σου στα βιβλία' },
};

const categoryIcons: Record<string, ReactNode> = {
  games: <Gamepad2 className="h-5 w-5" />,
  anime: <Sparkles className="h-5 w-5" />,
  manga: <BookOpen className="h-5 w-5" />,
  movies: <Film className="h-5 w-5" />,
  tv: <Tv className="h-5 w-5" />,
  books: <BookOpen className="h-5 w-5" />,
};

const readingTips: Record<string, string> = {
  manga: 'Εκτίμηση: ~4 ώρες ανά volume (220 σελίδες/volume, 55 σελίδες/ώρα).',

  books:
    'Κατά προσέγγιση: ~35–45 σελίδες/ώρα (ανάλογα τη δυσκολία), με βάση έναν μέσο ρυθμό ανάγνωσης.',
};

export function ProfileStats({ category, mediaStats }: Readonly<ProfileStatsProps>) {
  const titles = categoryTitles[category] || { eyebrow: 'Stats', title: 'Τα στατιστικά σου' };

  const labels: Record<string, { completed: string; current: string; planned: string }> = {
    games: { completed: 'Ολοκληρωμένα', current: 'Παίζω τώρα', planned: 'Backlog' },
    anime: { completed: 'Ολοκληρωμένα', current: 'Βλέπω τώρα', planned: 'Backlog' },
    manga: { completed: 'Ολοκληρωμένα', current: 'Διαβάζω τώρα', planned: 'Backlog' },
    movies: { completed: 'Είδα', current: 'Βλέπω', planned: 'Backlog' },
    tv: { completed: 'Ολοκληρωμένα', current: 'Βλέπω τώρα', planned: 'Backlog' },
    books: { completed: 'Διάβασα', current: 'Διαβάζω', planned: 'Backlog' },
  };
  const catLabels = labels[category] || {
    completed: 'Ολοκληρωμένα',
    current: 'Τρέχον',
    planned: 'Λίστα',
  };

  const stats: Stat[] = [
    {
      value: mediaStats?.total || 0,
      label: 'Σύνολο',
      icon: categoryIcons[category] || <Eye className="h-5 w-5" />,
    },
    {
      value: mediaStats?.completed || 0,
      label: catLabels.completed,
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
      value: mediaStats?.current || 0,
      label: catLabels.current,
      icon: <Play className="h-5 w-5" />,
    },
    {
      value: mediaStats?.planned || 0,
      label: catLabels.planned,
      icon: <ListTodo className="h-5 w-5" />,
    },
    {
      value: mediaStats?.dropped || 0,
      label: 'Παρατημένα',
      icon: <XCircle className="h-5 w-5" />,
    },
    {
      value: mediaStats?.favorites || 0,
      label: 'Αγαπημένα',
      icon: <Heart className="h-5 w-5" />,
    },
    {
      value: mediaStats?.totalTime || 0,
      label: 'Συνολικές ώρες',
      icon: <Clock className="h-5 w-5" />,
    },
  ];

  const primaryStats = stats.slice(0, 4);
  const secondaryStats = stats.slice(4);

  return (
    <section className="relative px-4 py-16 md:px-6 md:py-20">
      {/* Subtle gradient background like AboutStats */}
      <div className="via-[var(--hb-primary-strong)]/[0.03] absolute inset-0 bg-gradient-to-b from-[var(--hb-bg)] to-[var(--hb-bg)]" />

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--hb-primary-strong)]">
            {titles.eyebrow}
          </p>
          <h2 className="text-2xl font-bold text-[var(--hb-headline)] md:text-3xl">
            {titles.title}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {primaryStats.map(stat => (
            <div
              key={stat.label}
              className="hover:border-[var(--hb-primary-strong)]/40 group rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-5 text-center shadow-[0_12px_30px_rgba(3,7,18,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(229,9,20,0.1)]"
            >
              {/* Icon */}
              <div className="bg-[var(--hb-primary-strong)]/10 group-hover:bg-[var(--hb-primary-strong)]/20 mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-[var(--hb-primary-strong)] transition-colors">
                {stat.icon}
              </div>

              {/* Value with gradient */}
              <p className="mb-1 bg-gradient-to-r from-[var(--hb-primary-strong)] to-[var(--hb-accent)] bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">
                {stat.value}
              </p>

              {/* Label */}
              <p className="text-sm font-medium text-[var(--hb-headline)]">{stat.label}</p>

              {/* Note */}
              {stat.note && <p className="mt-1 text-xs text-[var(--hb-muted)]">{stat.note}</p>}
            </div>
          ))}
        </div>
        {secondaryStats.length > 0 && (
          <div className="mx-auto mt-6 w-full max-w-4xl">
            <div className="grid grid-cols-2 justify-items-center gap-4 md:grid-cols-3">
              {secondaryStats.map(stat => {
                const showTip = stat.label === 'Συνολικές ώρες' && Boolean(readingTips[category]);
                const tipText = showTip ? readingTips[category] : undefined;
                return (
                  <div
                    key={stat.label}
                    className="hover:border-[var(--hb-primary-strong)]/40 group w-full rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-5 text-center shadow-[0_12px_30px_rgba(3,7,18,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(229,9,20,0.1)]"
                  >
                    <div className="bg-[var(--hb-primary-strong)]/10 group-hover:bg-[var(--hb-primary-strong)]/20 mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-[var(--hb-primary-strong)] transition-colors">
                      {stat.icon}
                    </div>
                    <p className="mb-1 bg-gradient-to-r from-[var(--hb-primary-strong)] to-[var(--hb-accent)] bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">
                      {stat.value}
                    </p>
                    <p className="flex items-center justify-center gap-2 text-sm font-medium text-[var(--hb-headline)]">
                      {stat.label}
                      {tipText && (
                        <InfoHint
                          tip={tipText}
                          className="ml-0"
                          icon={
                            <span className="select-none rounded-full text-xs font-semibold text-[var(--hb-primary-strong)]">
                              i
                            </span>
                          }
                        />
                      )}
                    </p>
                    {stat.note && (
                      <p className="mt-1 text-xs text-[var(--hb-muted)]">{stat.note}</p>
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
