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
  Info,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { memo } from 'react';

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

function ProfileStatsComponent({ category, mediaStats }: Readonly<ProfileStatsProps>) {
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
    <section className="px-4 py-12 md:px-6 md:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center md:mb-10">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em]">
            {titles.eyebrow}
          </p>
          <h2 className="text-2xl font-semibold md:text-3xl">{titles.title}</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {primaryStats.map(stat => (
            <div key={stat.label} className="group rounded-[18px] border bg-card p-4 text-center">
              {/* Icon */}
              <div className="text-info mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-card">
                {stat.icon}
              </div>

              {/* Value */}
              <p className="mb-1 text-2xl font-semibold text-foreground md:text-[28px]">
                {stat.value}
              </p>

              {/* Label */}
              <p className="text-sm font-medium text-foreground">{stat.label}</p>

              {/* Note */}
              {stat.note && <p className="mt-1 text-xs text-muted-foreground">{stat.note}</p>}
            </div>
          ))}
        </div>
        {secondaryStats.length > 0 && (
          <div className="mx-auto mt-4 w-full max-w-4xl">
            <div className="grid grid-cols-2 justify-items-center gap-4 md:grid-cols-3">
              {secondaryStats.map(stat => {
                const showTip = stat.label === 'Συνολικές ώρες' && Boolean(readingTips[category]);
                const tipText = showTip ? readingTips[category] : undefined;
                return (
                  <div
                    key={stat.label}
                    className="group w-full rounded-[18px] border bg-card p-4 text-center"
                  >
                    <div className="text-info mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-card">
                      {stat.icon}
                    </div>
                    <p className="mb-1 text-2xl font-semibold text-foreground md:text-[28px]">
                      {stat.value}
                    </p>
                    <p className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
                      {stat.label}
                      {tipText && (
                        <TooltipProvider delayDuration={150}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="secondary"
                                aria-label="Πληροφορίες υπολογισμού"
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
                              {tipText}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </p>
                    {stat.note && <p className="mt-1 text-xs text-muted-foreground">{stat.note}</p>}
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

export const ProfileStats = memo(ProfileStatsComponent);
