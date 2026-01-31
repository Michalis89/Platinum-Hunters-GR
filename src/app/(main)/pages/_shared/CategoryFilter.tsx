'use client';

import Link from 'next/link';
import type { ArticleCategory } from '@/types/database';
import { CATEGORY_LABELS } from '@/app/(main)/pages/news/constants';
import { getVisibleCategories, type CategoryScope } from './categories';

type CategoryFilterProps = {
  scope: CategoryScope;
  currentCategory: ArticleCategory | null;
};

const VARIANT_STYLES: Record<
  CategoryScope,
  { active: string; inactive: string; allActive: string; allInactive: string }
> = {
  news: {
    active: 'border border-sky-500/30 bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30 hover:border-sky-500/50 hover:bg-sky-500/20',
    inactive: 'hover:border-[var(--hb-primary-strong)]/50 border border-[var(--hb-border)] bg-[var(--hb-surface)] text-[var(--hb-muted)] hover:text-[var(--hb-headline)]',
    allActive: 'border border-sky-500/30 bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30 hover:border-sky-500/50 hover:bg-sky-500/20',
    allInactive: 'border border-[var(--hb-border)] bg-[var(--hb-surface)] text-[var(--hb-muted)] hover:border-sky-500/50 hover:text-[var(--hb-headline)]',
  },
  reviews: {
    active: 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50',
    inactive: 'border border-[var(--hb-border)] bg-[var(--hb-surface)] text-[var(--hb-muted)] hover:border-amber-500/50 hover:text-[var(--hb-headline)]',
    allActive: 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50',
    allInactive: 'border border-[var(--hb-border)] bg-[var(--hb-surface)] text-[var(--hb-muted)] hover:border-amber-500/50 hover:text-[var(--hb-headline)]',
  },
};

const BASE_PATHS: Record<CategoryScope, string> = {
  news: '/pages/news',
  reviews: '/pages/reviews',
};

export default function CategoryFilter({ scope, currentCategory }: CategoryFilterProps) {
  const categories = getVisibleCategories({ scope });
  const styles = VARIANT_STYLES[scope];
  const basePath = BASE_PATHS[scope];

  return (
    <div className="flex gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Link
        href={basePath}
        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
          currentCategory ? styles.allInactive : styles.allActive
        }`}
      >
        Όλα
      </Link>
      {categories.map(category => (
        <Link
          key={category}
          href={`${basePath}?category=${category}`}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            currentCategory === category ? styles.active : styles.inactive
          }`}
        >
          {CATEGORY_LABELS[category] ?? category}
        </Link>
      ))}
    </div>
  );
}
