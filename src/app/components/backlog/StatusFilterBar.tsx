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

type FilterItem = {
  key: MediaStatus | 'all';
  label: string;
};

export default function StatusFilterBar({
  category,
  search,
  onSearchChange,
  activeStatus,
  onStatusChange,
}: Readonly<StatusFilterBarProps>) {
  const config = CATEGORY_CONFIG[category];

  const filters: FilterItem[] = [
    { key: 'all', label: 'Όλα' },
    ...(category !== 'movies' ? [{ key: 'current' as const, label: config.currentLabel }] : []),
    { key: 'planned', label: config.plannedLabel },
    { key: 'completed', label: config.completedLabel },
    { key: 'dropped', label: config.droppedLabel },
  ];

  return (
    <section className="apple-material-surface p-4 sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={onSearchChange}
            placeholder={config.searchPlaceholder}
            className="max-w-none"
          />
        </div>
        <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          <div className="flex min-w-max items-center gap-2">
            {filters.map(filter => (
              <button
                key={filter.key}
                type="button"
                data-active={activeStatus === filter.key}
                onClick={() => onStatusChange(filter.key)}
                className="apple-choice-chip shrink-0 px-4 py-2 text-xs font-semibold"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
