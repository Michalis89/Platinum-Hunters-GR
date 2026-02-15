'use client';

import type { CategoryTasteProfileItem, DashboardCategoryKey } from '@/lib/dashboard/category-data';
import CategoryTasteProfileCard from './CategoryTasteProfileCard';

type CategorySuggestionsProps = {
  category: DashboardCategoryKey;
  items: CategoryTasteProfileItem[];
};

export default function CategorySuggestions({ category, items }: CategorySuggestionsProps) {
  return (
    <section className="space-y-5 rounded-2xl border border-border/35 bg-card/70 p-5 md:p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Personal Insights</h3>
          <p className="text-xs text-muted-foreground/80">
            Built only from your own tracked entries.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <CategoryTasteProfileCard category={category} items={items} />
      </div>
    </section>
  );
}
