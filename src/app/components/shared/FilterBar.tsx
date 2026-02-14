'use client';

import Link from 'next/link';
import { Tag, X } from 'lucide-react';
import type { ArticleCategory } from '@/types/database';
import { CATEGORY_LABELS } from '@/app/(main)/pages/news/constants';
import { getVisibleCategories, type CategoryScope } from '@/app/(main)/pages/_shared/categories';

const BASE_PATHS: Record<CategoryScope, string> = {
  news: '/pages/news',
  reviews: '/pages/reviews',
};

const PILL_BASE =
  'inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary';
const PILL_ACTIVE = 'bg-primary border-primary text-white';
const PILL_INACTIVE =
  'border-border bg-card text-muted-foreground hover:border-primary/70 hover:bg-card/80 hover:text-foreground';
const PILL_SPACING = 'px-4 py-2 text-[13px]';

type FilterBarProps = {
  scope: CategoryScope;
  currentCategory: ArticleCategory | null;
  tagLabel?: string | null;
  primaryCategories?: ArticleCategory[];
};

const PRIMARY_CATEGORIES_DEFAULT: ArticleCategory[] = [
  'games',
  'anime',
  'manga',
  'movies',
  'tv',
  'books',
  'coding',
  'pet',
  'vape',
];

const CLEAR_BUTTON =
  'flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

export default function FilterBar({
  scope,
  currentCategory,
  tagLabel,
  primaryCategories,
}: FilterBarProps) {
  const categories = getVisibleCategories({ scope });
  const basePath = BASE_PATHS[scope];
  const activeCategory = currentCategory ?? null;
  const hasActiveCategory = Boolean(currentCategory);

  const primaries = (primaryCategories ?? PRIMARY_CATEGORIES_DEFAULT).filter(category =>
    categories.includes(category),
  );
  const primarySet = new Set(primaries);
  const secondaryCategories = categories.filter(category => !primarySet.has(category));

  const getHref = (category: ArticleCategory | null) =>
    category ? `${basePath}?category=${category}` : basePath;

  const isCategoryActive = (category: ArticleCategory | null) =>
    category ? category === activeCategory : !activeCategory;

  const renderPill = (category: ArticleCategory | null) => {
    const label = category ? (CATEGORY_LABELS[category] ?? category) : 'Όλα';
    const isActive = isCategoryActive(category);

    const styleClasses = isActive ? PILL_ACTIVE : PILL_INACTIVE;
    const spacingClasses = PILL_SPACING;

    return (
      <Link
        key={category ?? 'all'}
        href={getHref(category)}
        role="tab"
        aria-selected={isActive}
        className={`${PILL_BASE} ${spacingClasses} ${styleClasses}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="rounded-3xl border border-border bg-card/90 p-4 shadow-md">
      <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        <span>Κατηγορίες</span>
        {hasActiveCategory && (
          <Link href={basePath} className={CLEAR_BUTTON} aria-label="Επαναφορά φίλτρων">
            <X className="h-3 w-3" />
            <span className="text-[11px]">Εκκαθάριση</span>
          </Link>
        )}
      </div>

      <div role="tablist" aria-label="Κατηγορίες">
        <div className="flex flex-wrap items-center gap-2">
          {renderPill(null)}
          {primaries.map(category => renderPill(category))}
        </div>
        {secondaryCategories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">{secondaryCategories.map(renderPill)}</div>
        )}
      </div>

      {tagLabel && (
        <div className="mt-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <Tag size={12} />
          <span className="font-semibold text-foreground">{tagLabel}</span>
        </div>
      )}
    </div>
  );
}
