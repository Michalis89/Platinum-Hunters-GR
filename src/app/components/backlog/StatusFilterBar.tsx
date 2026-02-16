'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    { key: 'all', label: 'All' },
    { key: 'planned', label: config.plannedLabel },
    { key: 'current', label: config.currentLabel },
    { key: 'completed', label: config.completedLabel },
    { key: 'dropped', label: config.droppedLabel },
  ];

  return (
    <section className="sticky top-20 z-30 rounded-2xl border border-border/70 bg-background/95 p-4 shadow-sm supports-[backdrop-filter]:bg-background/95 sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            placeholder={config.searchPlaceholder}
            className="h-11 rounded-xl border-border/70 bg-card/70 pl-10"
          />
        </div>

        <Tabs
          value={activeStatus}
          onValueChange={value => onStatusChange(value as MediaStatus | 'all')}
        >
          <TabsList className="h-11 w-full justify-start gap-1 overflow-x-auto rounded-xl border border-border/70 bg-card/70 p-1 [scrollbar-width:thin]">
            {filters.map(filter => (
              <TabsTrigger
                key={filter.key}
                value={filter.key}
                className="h-9 shrink-0 rounded-lg px-4 text-xs font-semibold sm:text-sm"
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
