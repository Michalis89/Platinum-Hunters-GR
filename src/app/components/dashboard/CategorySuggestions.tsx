'use client';

import type { CategoryTasteProfileItem, DashboardCategoryKey } from '@/lib/dashboard/category-data';
import CategoryTasteProfileCard from './CategoryTasteProfileCard';

type CategorySuggestionsProps = {
  category: DashboardCategoryKey;
  items: CategoryTasteProfileItem[];
};

export default function CategorySuggestions({ category, items }: CategorySuggestionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Personal Insights</h3>
          <p className="text-xs text-muted-foreground">Built only from your own tracked entries.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CategoryTasteProfileCard category={category} items={items} />
      </div>
    </div>
  );
}
