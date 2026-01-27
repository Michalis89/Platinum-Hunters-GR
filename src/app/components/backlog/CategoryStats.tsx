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

export default function CategoryStats({
  category,
  totalEntries,
  counts,
}: Readonly<CategoryStatsProps>) {
  const config = CATEGORY_CONFIG[category];

  return (
    <div
      className={`mt-6 grid gap-4 ${
        category === 'movies'
          ? 'md:grid-cols-3'
          : category === 'books'
            ? 'md:grid-cols-5'
            : 'md:grid-cols-4'
      }`}
    >
      <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">Entries</p>
        <p className="mt-2 text-3xl font-bold text-[var(--hb-primary-strong)]">{totalEntries}</p>
        <p className="text-xs text-[var(--hb-muted)]">Συνολικές καταχωρήσεις</p>
      </div>

      {category !== 'movies' ? (
        <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">
            {config.currentLabel}
          </p>
          <p className="mt-2 text-3xl font-bold text-[var(--hb-headline)]">{counts.current}</p>
          <p className="text-xs text-[var(--hb-muted)]">Σε εξέλιξη</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">
            {config.droppedLabel}
          </p>
          <p className="mt-2 text-3xl font-bold text-[var(--hb-headline)]">{counts.dropped}</p>
          <p className="text-xs text-[var(--hb-muted)]">Παρατημένα</p>
        </div>
      )}

      {category === 'books' && (
        <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">
            {config.plannedLabel}
          </p>
          <p className="mt-2 text-3xl font-bold text-[var(--hb-headline)]">{counts.planned}</p>
          <p className="text-xs text-[var(--hb-muted)]">Προς ανάγνωση</p>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">
          {config.completedLabel}
        </p>
        <p className="mt-2 text-3xl font-bold text-[var(--hb-headline)]">{counts.completed}</p>
        <p className="text-xs text-[var(--hb-muted)]">Ολοκληρωμένα</p>
      </div>

      {category !== 'movies' && (
        <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">
            {config.droppedLabel}
          </p>
          <p className="mt-2 text-3xl font-bold text-[var(--hb-headline)]">{counts.dropped}</p>
          <p className="text-xs text-[var(--hb-muted)]">Παρατημένα</p>
        </div>
      )}
    </div>
  );
}
