'use client';

import { Button } from '@/components/ui/button';
import { MediaCategory, CATEGORY_CONFIG } from './types';

interface CategoryHeaderProps {
  category: MediaCategory;
  username?: string | null;
  onCreateClick: () => void;
  onSuggestionsClick: () => void;
}

export default function CategoryHeader({
  category,
  username,
  onCreateClick,
  onSuggestionsClick,
}: Readonly<CategoryHeaderProps>) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="bg-[var(--hb-primary-strong)]/20 flex h-12 w-12 items-center justify-center rounded-2xl text-[var(--hb-primary-strong)] shadow-[var(--hb-shadow-md)] sm:h-14 sm:w-14">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--hb-muted)] sm:text-xs sm:tracking-[0.35em]">
            {username ? `${username} • ` : ''}
            {category.toUpperCase()}
          </p>
          <h1 className="text-2xl font-bold text-[var(--hb-headline)] sm:text-3xl md:text-4xl">
            {config.title}
          </h1>
          <p className="text-sm text-[var(--hb-muted)]">{config.subtitle}</p>
        </div>
      </div>
      <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
        <Button variant="primary" onClick={onCreateClick} className="w-full sm:w-auto">
          Νέα καταχώρηση
        </Button>
        <Button variant="secondary" onClick={onSuggestionsClick} className="w-full sm:w-auto">
          Προτάσεις
        </Button>
      </div>
    </div>
  );
}
