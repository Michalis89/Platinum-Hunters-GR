'use client';

import { useEffect, useState } from 'react';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import { AboutStats, AboutStatsProps } from '@/app/components/about/AboutStats';

const EMPTY_STATS: AboutStatsProps = {
  totalUsers: 0,
  totalGames: 0,
  totalAnime: 0,
  totalManga: 0,
  totalMovies: 0,
  totalTv: 0,
  totalBooks: 0,
  totalArticles: 0,
};

export default function AboutStatsLoader() {
  const [stats, setStats] = useState<AboutStatsProps | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const response = await fetch('/api/public/stats');
        if (!response.ok) {
          throw new Error('Failed to load public stats');
        }
        const data = (await response.json()) as AboutStatsProps;
        if (mounted) {
          setStats(data);
        }
      } catch (error) {
        console.error('About stats fetch failed', error);
        if (mounted) {
          setStats(EMPTY_STATS);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!stats) {
    return (
      <section className="relative px-4 py-20 md:px-6 md:py-28">
        <div className="via-[var(--hb-primary-strong)]/[0.03] absolute inset-0 bg-gradient-to-b from-[var(--hb-bg)] to-[var(--hb-bg)]" />
        <div className="relative mx-auto flex max-w-6xl justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </section>
    );
  }

  return <AboutStats {...stats} />;
}
