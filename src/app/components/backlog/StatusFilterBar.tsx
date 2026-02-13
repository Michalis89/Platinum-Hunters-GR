'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
    { key: 'planned', label: config.plannedLabel },
    ...(category !== 'movies' ? [{ key: 'current' as const, label: config.currentLabel }] : []),
    { key: 'completed', label: config.completedLabel },
    { key: 'dropped', label: config.droppedLabel },
  ];

  return (
    <section className="p-4 sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search size={16} />
            </div>
            <Input
              type="search"
              value={search}
              onChange={event => onSearchChange(event.target.value)}
              placeholder={config.searchPlaceholder}
              className="pl-10"
            />
          </div>
        </div>
        <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          <div className="flex min-w-max items-center gap-2">
            {filters.map(filter => (
              <button
                key={filter.key}
                type="button"
                data-active={activeStatus === filter.key}
                onClick={() => onStatusChange(filter.key)}
                className="shrink-0 px-4 py-2 text-xs font-semibold"
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
