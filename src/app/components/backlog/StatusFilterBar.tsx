'use client';

import { SearchBar } from '@/app/components/ui/SearchBar';
import { MediaCategory, MediaStatus, CATEGORY_CONFIG } from './types';

interface StatusFilterBarProps {
  category: MediaCategory;
  search: string;
  onSearchChange: (value: string) => void;
  activeStatus: MediaStatus | 'all';
  onStatusChange: (status: MediaStatus | 'all') => void;
}

export default function StatusFilterBar({
  category,
  search,
  onSearchChange,
  activeStatus,
  onStatusChange,
}: Readonly<StatusFilterBarProps>) {
  const config = CATEGORY_CONFIG[category];

  const getButtonClass = (status: MediaStatus | 'all') =>
    `rounded-full px-4 py-2 text-xs font-semibold transition ${
      activeStatus === status
        ? 'bg-[var(--hb-primary-strong)]/20 text-[var(--hb-primary-strong)]'
        : 'border border-[var(--hb-border)] text-[var(--hb-muted)] hover:text-[var(--hb-text)]'
    }`;

  return (
    <section className="rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-[var(--hb-shadow-md)] backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={onSearchChange}
            placeholder={config.searchPlaceholder}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => onStatusChange('all')} className={getButtonClass('all')}>
            Όλα
          </button>
          {category !== 'movies' && (
            <button onClick={() => onStatusChange('current')} className={getButtonClass('current')}>
              {config.currentLabel}
            </button>
          )}
          <button onClick={() => onStatusChange('planned')} className={getButtonClass('planned')}>
            {config.plannedLabel}
          </button>
          <button
            onClick={() => onStatusChange('completed')}
            className={getButtonClass('completed')}
          >
            {config.completedLabel}
          </button>
          <button onClick={() => onStatusChange('dropped')} className={getButtonClass('dropped')}>
            {config.droppedLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
