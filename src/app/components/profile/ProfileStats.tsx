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
import { ProfileStatsInfoTooltip } from './ProfileStatsInfoTooltip.client';

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
  games: { eyebrow: 'Gaming Stats', title: 'Your progress in games' },
  anime: { eyebrow: 'Anime Stats', title: 'Your progress in anime' },
  manga: { eyebrow: 'Manga Stats', title: 'Your progress in manga' },
  movies: { eyebrow: 'Movies Stats', title: 'Your progress in movies' },
  tv: { eyebrow: 'TV Stats', title: 'Your progress in series' },
  books: { eyebrow: 'Books Stats', title: 'Your progress in books' },
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
  manga: 'Estimate: ~4 hours per volume (220 pages/volume, 55 pages/hour).',

  books:
    'Approximate: ~35-45 pages/hour (depending on difficulty), based on an average reading speed.',
};

export function ProfileStats({ category, mediaStats }: Readonly<ProfileStatsProps>) {
  const titles = categoryTitles[category] || { eyebrow: 'Stats', title: 'Your stats' };

  const labels: Record<string, { completed: string; current: string; planned: string }> = {
    games: { completed: 'Completed', current: 'Playing now', planned: 'Backlog' },
    anime: { completed: 'Completed', current: 'Watching now', planned: 'Backlog' },
    manga: { completed: 'Completed', current: 'Reading now', planned: 'Backlog' },
    movies: { completed: 'Watched', current: 'Watching', planned: 'Backlog' },
    tv: { completed: 'Completed', current: 'Watching now', planned: 'Backlog' },
    books: { completed: 'Read', current: 'Reading', planned: 'Backlog' },
  };
  const catLabels = labels[category] || {
    completed: 'Completed',
    current: 'Current',
    planned: 'List',
  };

  const stats: Stat[] = [
    {
      value: mediaStats?.total || 0,
      label: 'Total',
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
      label: 'Dropped',
      icon: <XCircle className="h-5 w-5" />,
    },
    {
      value: mediaStats?.favorites || 0,
      label: 'Favorites',
      icon: <Heart className="h-5 w-5" />,
    },
    {
      value: mediaStats?.totalTime || 0,
      label: 'Total hours',
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
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-card text-primary">
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
                const showTip = stat.label === 'Total hours' && Boolean(readingTips[category]);
                const tipText = showTip ? readingTips[category] : undefined;
                return (
                  <div
                    key={stat.label}
                    className="group w-full rounded-[18px] border bg-card p-4 text-center"
                  >
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-card text-primary">
                      {stat.icon}
                    </div>
                    <p className="mb-1 text-2xl font-semibold text-foreground md:text-[28px]">
                      {stat.value}
                    </p>
                    <p className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
                      {stat.label}
                      {tipText && (
                        <ProfileStatsInfoTooltip text={tipText} />
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
