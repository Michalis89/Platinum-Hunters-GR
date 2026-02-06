'use client';

import { SearchBar } from '@/app/components/ui/SearchBar';
import { MediaCategory, MediaStatus, CATEGORY_CONFIG } from './types';
import { Button } from '@/components/ui/button';

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

  const getButtonVariant = (status: MediaStatus | 'all') =>
    activeStatus === status ? 'primary' : 'secondary';
  const baseButtonClass = 'shrink-0 rounded-full px-4 py-2 text-xs font-semibold';

  return (
    <section className="rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4 shadow-[var(--hb-shadow-md)] backdrop-blur sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={onSearchChange}
            placeholder={config.searchPlaceholder}
          />
        </div>
        <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          <div className="flex min-w-max items-center gap-2">
          <Button
            variant={getButtonVariant('all')}
            onClick={() => onStatusChange('all')}
            className={baseButtonClass}
          >
            Όλα
          </Button>
          {category !== 'movies' && (
            <Button
              variant={getButtonVariant('current')}
              onClick={() => onStatusChange('current')}
              className={baseButtonClass}
            >
              {config.currentLabel}
            </Button>
          )}
          <Button
            variant={getButtonVariant('planned')}
            onClick={() => onStatusChange('planned')}
            className={baseButtonClass}
          >
            {config.plannedLabel}
          </Button>
          <Button
            variant={getButtonVariant('completed')}
            onClick={() => onStatusChange('completed')}
            className={baseButtonClass}
          >
            {config.completedLabel}
          </Button>
          <Button
            variant={getButtonVariant('dropped')}
            onClick={() => onStatusChange('dropped')}
            className={baseButtonClass}
          >
            {config.droppedLabel}
          </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
