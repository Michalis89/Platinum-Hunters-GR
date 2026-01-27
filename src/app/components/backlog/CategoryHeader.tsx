'use client';

import Button from '@/app/components/ui/Button';
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
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className="bg-[var(--hb-primary-strong)]/20 flex h-14 w-14 items-center justify-center rounded-2xl text-[var(--hb-primary-strong)] shadow-[0_0_24px_rgba(229,9,20,0.35)]">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--hb-muted)]">
            {username ? `${username} • ` : ''}
            {category.toUpperCase()}
          </p>
          <h1 className="text-3xl font-bold text-[var(--hb-headline)] md:text-4xl">{config.title}</h1>
          <p className="text-sm text-[var(--hb-muted)]">{config.subtitle}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="border-[var(--hb-primary-strong)]/40 text-[var(--hb-primary-strong)] hover:border-[var(--hb-primary-strong)]"
          onClick={onCreateClick}
        >
          Νέα καταχώρηση
        </Button>
        <Button
          variant="primary"
          className="bg-[var(--hb-primary-strong)] text-[var(--hb-bg)] hover:brightness-110"
          onClick={onSuggestionsClick}
        >
          Προτάσεις
        </Button>
      </div>
    </div>
  );
}
