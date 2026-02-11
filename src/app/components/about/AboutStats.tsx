import { Gamepad2, Film, Tv, BookText, Newspaper, Users, Sparkles, BookMarked } from 'lucide-react';
import type { ReactNode } from 'react';

type Stat = {
  value: string | number;
  label: string;
  icon: ReactNode;
};

export type AboutStatsProps = {
  totalUsers: number;
  totalGames: number;
  totalAnime: number;
  totalManga: number;
  totalMovies: number;
  totalTv: number;
  totalBooks: number;
  totalArticles: number;
};

export function AboutStats({
  totalUsers,
  totalGames,
  totalAnime,
  totalManga,
  totalMovies,
  totalTv,
  totalBooks,
  totalArticles,
}: AboutStatsProps) {
  const stats: Stat[] = [
    {
      value: totalGames || '—',
      label: 'Games',
      icon: <Gamepad2 className="h-5 w-5" />,
    },
    {
      value: totalAnime || '—',
      label: 'Anime',
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      value: totalManga || '—',
      label: 'Manga',
      icon: <BookMarked className="h-5 w-5" />,
    },
    {
      value: totalMovies || '—',
      label: 'Movies',
      icon: <Film className="h-5 w-5" />,
    },
    {
      value: totalTv || '—',
      label: 'Series',
      icon: <Tv className="h-5 w-5" />,
    },
    {
      value: totalBooks || '—',
      label: 'Books',
      icon: <BookText className="h-5 w-5" />,
    },
    {
      value: totalArticles || '—',
      label: 'Articles',
      icon: <Newspaper className="h-5 w-5" />,
    },
    {
      value: totalUsers || '—',
      label: 'Users',
      icon: <Users className="h-5 w-5" />,
    },
  ];

  const activeStats = stats.filter(stat => stat.value !== 0 && stat.value !== '—');

  const displayStats = activeStats.length >= 4 ? activeStats : stats.slice(0, 6);

  return (
    <section className="relative px-4 py-20 md:px-6 md:py-28">
      <div className="via-[var(--hb-primary-strong)]/[0.03] absolute inset-0 bg-gradient-to-b from-[var(--hb-bg)] to-[var(--hb-bg)]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--hb-primary-strong)]">
            Our library
          </p>
          <h2 className="text-3xl font-bold text-[var(--hb-headline)] md:text-4xl">
            Content in numbers
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {displayStats.map(stat => (
            <div
              key={stat.label}
              className="hover:border-[var(--hb-primary-strong)]/40 w-[calc(50%-0.5rem)] rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-5 text-center shadow-[var(--hb-shadow-md)] transition sm:w-[calc(33.333%-0.75rem)] lg:w-[calc(20%-0.8rem)]"
            >
              <div className="mb-2 flex justify-center text-[var(--hb-primary-strong)]">
                {stat.icon}
              </div>
              <p className="mb-1 bg-gradient-to-r from-[var(--hb-primary-strong)] to-[var(--hb-accent)] bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">
                {stat.value}
              </p>
              <p className="text-sm font-medium text-[var(--hb-headline)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
