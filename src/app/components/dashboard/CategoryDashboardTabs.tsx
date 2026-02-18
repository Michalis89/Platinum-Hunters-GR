'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DASHBOARD_TAB_CATEGORIES } from '@/lib/dashboard/category-data';
import type { CategoryDashboardSection, DashboardCategoryKey } from '@/lib/dashboard/category-data';
import type { PersonalStats } from '@/app/components/home/types';
import CategoryTopFive from './CategoryTopFive';
import CategorySuggestions from './CategorySuggestions';
import MediaSuggestions from './MediaSuggestions';
import PlatformInsight from './PlatformInsight';
import DashboardCategoryStats from './DashboardCategoryStats';

const CategoryInsightChart = dynamic(() => import('./CategoryInsightChart'), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-border/50 bg-card/30">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading chart...</p>
      </div>
    </div>
  ),
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
  stats: PersonalStats;
};

export default function CategoryDashboardTabs({
  enabledCategories,
  sections,
  stats,
}: CategoryDashboardTabsProps) {
  const visibleCategories = DASHBOARD_TAB_CATEGORIES.filter(category =>
    enabledCategories.includes(category),
  );
  const firstCategory = useMemo(() => visibleCategories[0], [visibleCategories]);
  const [activeCategory, setActiveCategory] = useState<DashboardCategoryKey | undefined>(
    firstCategory,
  );

  useEffect(() => {
    if (!visibleCategories.length) {
      return;
    }
    if (!activeCategory || !visibleCategories.includes(activeCategory)) {
      setActiveCategory(visibleCategories[0]);
    }
  }, [activeCategory, visibleCategories]);

  if (!visibleCategories.length) {
    return null;
  }

  const resolveStatsForCategory = (category: DashboardCategoryKey) => {
    const categoryStats =
      category === 'games'
        ? stats.games
        : category === 'anime'
          ? stats.anime
          : category === 'manga'
            ? stats.manga
            : category === 'movies'
              ? stats.movies
              : category === 'tv'
                ? stats.tv
                : stats.books;

    const total = categoryStats.total ?? 0;
    const completed = categoryStats.completed ?? 0;
    const current = categoryStats.in_progress ?? 0;
    const dropped = categoryStats.dropped ?? 0;
    const hours = categoryStats.hours ?? 0;
    const planned = Math.max(0, total - completed - current - dropped);
    const favorites = sections[category]?.favorites?.length ?? 0;

    return { total, completed, current, planned, dropped, favorites, hours };
  };

  return (
    <Tabs
      value={activeCategory}
      onValueChange={value => setActiveCategory(value as DashboardCategoryKey)}
      className="space-y-8 md:space-y-10"
    >
      <div className="overflow-x-auto pb-1 [scrollbar-width:thin] sm:flex sm:justify-center">
        <TabsList className="inline-flex h-auto min-w-full items-center justify-start gap-1 rounded-xl border border-border/45 bg-card/70 p-1 supports-[backdrop-filter]:bg-card/65 sm:min-w-0 sm:flex-wrap sm:justify-center">
          {visibleCategories.map(category => (
            <TabsTrigger
              key={category}
              value={category}
              className="h-9 px-3 text-xs uppercase tracking-[0.12em] sm:text-[11px]"
            >
              {CATEGORY_TITLES[category]}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className="min-w-0 space-y-8">
        {visibleCategories.map(category => (
          <TabsContent key={category} value={category} className="mt-0 space-y-7 md:space-y-8">
            <DashboardCategoryStats category={category} stats={resolveStatsForCategory(category)} />
            <CategoryTopFive
              category={category}
              items={sections[category]?.topFive ?? []}
              favorites={sections[category]?.favorites ?? []}
            />
            <MediaSuggestions
              suggestions={sections[category]?.mediaSuggestions ?? []}
              category={CATEGORY_TITLES[category]}
            />
            <CategorySuggestions
              category={category}
              items={sections[category]?.tasteProfileItems ?? []}
            />
            {category === 'games' && (
              <PlatformInsight payload={sections[category]?.platformInsight ?? null} />
            )}
            <CategoryInsightChart
              payload={sections[category]?.chart ?? { data: [], insight: '' }}
              category={category}
            />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
