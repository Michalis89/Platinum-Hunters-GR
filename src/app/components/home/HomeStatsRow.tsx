import { Users, Activity, BookOpen, Gamepad2 } from 'lucide-react';
import type { ReactNode } from 'react';

type StatItem = {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
};

type HomeStatsRowProps = {
  totalUsers: number | string;
  activeNow: number | string;
  totalGuides: number | string;
  totalGames: number | string;
};

export function HomeStatsRow({
  totalUsers,
  activeNow,
  totalGuides,
  totalGames,
}: HomeStatsRowProps) {
  const stats: StatItem[] = [
    {
      label: 'Χρήστες',
      value: totalUsers,
      icon: <Users className="h-5 w-5" />,
      color: 'text-rose-400',
    },
    {
      label: 'Ενεργοί τώρα',
      value: activeNow,
      icon: <Activity className="h-5 w-5" />,
      color: 'text-emerald-400',
    },
    {
      label: 'Οδηγοί',
      value: totalGuides,
      icon: <BookOpen className="h-5 w-5" />,
      color: 'text-amber-400',
    },
    {
      label: 'Παιχνίδια',
      value: totalGames,
      icon: <Gamepad2 className="h-5 w-5" />,
      color: 'text-sky-400',
    },
  ];

  return (
    <section className="px-4 md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-[var(--hb-muted)]">
                  {stat.label}
                </span>
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <p className="text-2xl font-bold text-[var(--hb-headline)] md:text-3xl">
                {stat.value === '–' || stat.value === undefined ? '–' : stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
