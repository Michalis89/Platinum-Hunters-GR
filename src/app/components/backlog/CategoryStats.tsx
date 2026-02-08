'use client';

import { MediaCategory, CATEGORY_CONFIG } from './types';

interface CategoryStatsProps {
  category: MediaCategory;
  totalEntries: number;
  counts: {
    planned: number;
    current: number;
    completed: number;
    dropped: number;
  };
}

type StatCard = {
  key: string;
  label: string;
  value: number;
  caption: string;
  accent?: boolean;
};

export default function CategoryStats({
  category,
  totalEntries,
  counts,
}: Readonly<CategoryStatsProps>) {
  const config = CATEGORY_CONFIG[category];

  const cards: StatCard[] = [
    {
      key: 'entries',
      label: 'Entries',
      value: totalEntries,
      caption: 'Συνολικές καταχωρήσεις',
      accent: true,
    },
    ...(category === 'games'
      ? [
          {
            key: 'games-backlog',
            label: 'Backlog',
            value: counts.planned,
            caption: 'Σε κατάσταση backlog',
          },
        ]
      : []),
    {
      key: category === 'movies' ? 'dropped-alt' : 'current',
      label: category === 'movies' ? config.droppedLabel : config.currentLabel,
      value: category === 'movies' ? counts.dropped : counts.current,
      caption: category === 'movies' ? 'Παρατημένα' : 'Σε εξέλιξη',
    },
    ...(category === 'books'
      ? [
          {
            key: 'planned',
            label: config.plannedLabel,
            value: counts.planned,
            caption: 'Προς ανάγνωση',
          },
        ]
      : []),
    {
      key: 'completed',
      label: config.completedLabel,
      value: counts.completed,
      caption: 'Ολοκληρωμένα',
    },
    ...(category !== 'movies'
      ? [
          {
            key: 'dropped',
            label: config.droppedLabel,
            value: counts.dropped,
            caption: 'Παρατημένα',
          },
        ]
      : []),
  ];

  return (
    <div
      className={`mt-6 grid gap-3 sm:gap-4 ${
        category === 'movies'
          ? 'grid-cols-2 md:grid-cols-3'
          : category === 'books'
            ? 'grid-cols-2 md:grid-cols-5'
            : category === 'games'
              ? 'grid-cols-2 md:grid-cols-5'
              : 'grid-cols-2 md:grid-cols-4'
      }`}
    >
      {cards.map(card => (
        <article
          key={card.key}
          className="apple-card rounded-[20px] border-[var(--apple-separator)] p-4 sm:p-5"
        >
          <p className="apple-body-tracking text-[11px] uppercase tracking-[0.2em] text-[var(--apple-secondary-label)]">
            {card.label}
          </p>
          <p
            className={`apple-title-tracking mt-2 text-3xl font-semibold ${
              card.accent ? 'text-[var(--apple-system-blue)]' : 'text-[var(--apple-label)]'
            }`}
          >
            {card.value}
          </p>
          <p className="mt-1 text-xs text-[var(--apple-secondary-label)]">{card.caption}</p>
        </article>
      ))}
    </div>
  );
}