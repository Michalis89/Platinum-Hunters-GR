'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MediaCategory, MediaStatus } from './types';
import { CATEGORY_CONFIG } from './types';

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
    { key: 'all', label: 'All' },
    { key: 'planned', label: config.plannedLabel },
    { key: 'current', label: config.currentLabel },
    { key: 'completed', label: config.completedLabel },
    { key: 'dropped', label: config.droppedLabel },
  ];

  return (
    <section className="sticky top-20 z-30 rounded-2xl border border-border/70 bg-background/95 px-4 py-3 shadow-sm supports-[backdrop-filter]:bg-background/95 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/* Search — 1/3 */}
        <div className="relative sm:shrink-0 sm:basis-1/3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            placeholder={config.searchPlaceholder}
            className="h-10 rounded-xl border-border/60 bg-card/60 pl-10 text-sm"
          />
        </div>

        {/* Filters — 2/3 */}
        <Tabs
          value={activeStatus}
          onValueChange={value => onStatusChange(value as MediaStatus | 'all')}
          className="sm:flex-1"
        >
          <TabsList className="flex h-10 w-full items-center gap-0.5 rounded-xl border border-border/60 bg-card/60 p-1">
            {filters.map(filter => (
              <TabsTrigger
                key={filter.key}
                value={filter.key}
                className="h-8 flex-1 rounded-lg px-2 text-[12px] font-semibold"
              >
                {filter.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </section>
  );
}
