'use client';

import dynamic from 'next/dynamic';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DASHBOARD_TAB_CATEGORIES } from '@/lib/dashboard/category-data';
import type { CategoryDashboardSection, DashboardCategoryKey } from '@/lib/dashboard/category-data';
import CategoryTopFive from './CategoryTopFive';
import CategorySpotlights from './CategorySpotlights';
import CategorySuggestions from './CategorySuggestions';
import MediaSuggestions from './MediaSuggestions';

const CategoryInsightChart = dynamic(() => import('./CategoryInsightChart'), {
  ssr: false,
});

const CATEGORY_TITLES: Record<DashboardCategoryKey, string> = {
  games: 'Games',
  books: 'Books',
  anime: 'Anime',
  manga: 'Manga',
  movies: 'Movies',
  tv: 'TV',
};

type CategoryDashboardTabsProps = {
  enabledCategories: DashboardCategoryKey[];
  sections: Record<DashboardCategoryKey, CategoryDashboardSection>;
};

export default function CategoryDashboardTabs({
  enabledCategories,
  sections,
}: CategoryDashboardTabsProps) {
  const visibleCategories = DASHBOARD_TAB_CATEGORIES.filter(category =>
    enabledCategories.includes(category),
  );

  if (!visibleCategories.length) {
    return null;
  }

  return (
    <Tabs defaultValue={visibleCategories[0]} className="space-y-6">
      <TabsList className="flex flex-wrap items-center gap-1 overflow-x-auto rounded-lg bg-muted/70 p-1 text-[11px]">
        {visibleCategories.map(category => (
          <TabsTrigger key={category} value={category} className="px-3 py-1 text-[11px] uppercase tracking-[0.15em]">
            {CATEGORY_TITLES[category]}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="space-y-6">
        {visibleCategories.map(category => (
          <TabsContent key={category} value={category} className="space-y-6">
            <CategoryTopFive
              category={category}
              items={sections[category]?.topFive ?? []}
              favorites={sections[category]?.favorites ?? []}
            />
            <MediaSuggestions
              suggestions={sections[category]?.mediaSuggestions ?? []}
              category={CATEGORY_TITLES[category]}
            />
            <CategorySpotlights cards={sections[category]?.spotlights ?? []} />
            <CategoryInsightChart
              payload={sections[category]?.chart ?? { data: [], insight: '' }}
              category={category}
            />
            <CategorySuggestions suggestions={sections[category]?.suggestions ?? []} />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
