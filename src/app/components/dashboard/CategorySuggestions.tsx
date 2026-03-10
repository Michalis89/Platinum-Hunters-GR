'use client';

import type { CategoryTasteProfileItem, DashboardCategoryKey } from '@/lib/dashboard/category-data';
import CategoryTasteProfileCard from './CategoryTasteProfileCard';
import DashboardSectionHeader from './DashboardSectionHeader';

type CategorySuggestionsProps = {
  category: DashboardCategoryKey;
  items: CategoryTasteProfileItem[];
};

const CATEGORY_LABELS: Record<DashboardCategoryKey, string> = {
  games: 'Games',
  books: 'Books',
  anime: 'Anime',
  manga: 'Manga',
  movies: 'Movies',
  tv: 'TV',
};

export default function CategorySuggestions({ category, items }: CategorySuggestionsProps) {
  const categoryLabel = CATEGORY_LABELS[category];
  const categoryLabelForSentence =
    categoryLabel === 'TV' ? categoryLabel : categoryLabel.toLowerCase();

  return (
    <section className="space-y-4">
      <DashboardSectionHeader
        eyebrow="Why these fit you"
        title={`A closer look at your ${categoryLabelForSentence} habits`}
        rightSlot={
          items.length > 0 ? (
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
              {items.length} reason{items.length === 1 ? '' : 's'}
            </span>
          ) : undefined
        }
      />
      <div className="grid gap-4 md:grid-cols-2 md:gap-5">
        <CategoryTasteProfileCard category={category} items={items} />
      </div>
    </section>
  );
}
