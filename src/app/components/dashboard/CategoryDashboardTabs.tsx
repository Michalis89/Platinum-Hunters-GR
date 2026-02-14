'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DASHBOARD_TAB_CATEGORIES } from '@/lib/dashboard/category-data';
import type { CategoryDashboardSection, DashboardCategoryKey } from '@/lib/dashboard/category-data';
import CategoryTopFive from './CategoryTopFive';
import CategorySpotlights from './CategorySpotlights';
import CategorySuggestions from './CategorySuggestions';
import MediaSuggestions from './MediaSuggestions';
import PlatformInsight from './PlatformInsight';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const visibleCategories = DASHBOARD_TAB_CATEGORIES.filter(category =>
    enabledCategories.includes(category),
  );
  const firstCategory = useMemo(() => visibleCategories[0], [visibleCategories]);
  const [activeCategory, setActiveCategory] = useState<DashboardCategoryKey | undefined>(
    firstCategory,
  );

  useEffect(() => {
    if (!visibleCategories.length) return;
    if (!activeCategory || !visibleCategories.includes(activeCategory)) {
      setActiveCategory(visibleCategories[0]);
    }
  }, [activeCategory, visibleCategories]);

  if (!visibleCategories.length) {
    return null;
  }

  return (
    <Tabs
      value={activeCategory}
      onValueChange={value => setActiveCategory(value as DashboardCategoryKey)}
    >
      <div className="mb-4 md:hidden">
        <TabsList className="flex flex-wrap items-center gap-1 overflow-x-auto rounded-lg bg-muted/70 p-1 text-[11px]">
          {visibleCategories.map(category => (
            <TabsTrigger
              key={category}
              value={category}
              className="px-3 py-1 text-[11px] uppercase tracking-[0.15em]"
            >
              {CATEGORY_TITLES[category]}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
        <aside
          className={cn(
            'sticky top-24 hidden h-fit overflow-hidden rounded-xl border border-border/80 bg-card/70 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60 md:block',
            'transition-[width] duration-200 ease-out',
            isSidebarCollapsed ? 'w-[4.5rem]' : 'w-56',
          )}
        >
          <div className="flex items-center border-b border-border/70 p-2">
            {!isSidebarCollapsed && (
              <p className="truncate px-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Categories
              </p>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8 text-muted-foreground hover:bg-accent/30 hover:text-foreground"
              onClick={() => setIsSidebarCollapsed(prev => !prev)}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          <nav className="space-y-1 p-2">
            {visibleCategories.map(category => {
              const isActive = activeCategory === category;
              const label = CATEGORY_TITLES[category];

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    'flex w-full items-center rounded-md border px-2 py-2 text-left text-xs font-medium uppercase tracking-[0.1em] transition-colors',
                    isSidebarCollapsed ? 'justify-center' : 'gap-2',
                    isActive
                      ? 'border-primary/40 bg-primary/15 text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-border/80 hover:bg-accent/25 hover:text-foreground',
                  )}
                  title={label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="inline-flex h-2 w-2 rounded-full bg-primary/70" />
                  <span className={cn('truncate', isSidebarCollapsed && 'hidden')}>{label}</span>
                  {isSidebarCollapsed && <span className="sr-only">{label}</span>}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 space-y-6">
          {visibleCategories.map(category => (
            <TabsContent key={category} value={category} className="mt-0 space-y-6">
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
              {category === 'games' && (
                <PlatformInsight payload={sections[category]?.platformInsight ?? null} />
              )}
              <CategoryInsightChart
                payload={sections[category]?.chart ?? { data: [], insight: '' }}
                category={category}
              />
              <CategorySuggestions suggestions={sections[category]?.suggestions ?? []} />
            </TabsContent>
          ))}
        </div>
      </div>
    </Tabs>
  );
}
