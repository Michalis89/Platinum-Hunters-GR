'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PersonalStats } from './types';
import { DASHBOARD_TAB_CATEGORIES } from '@/lib/dashboard/category-data';
import type { CategoryDashboardSection, DashboardCategoryKey } from '@/lib/dashboard/category-data';
import type { ContinueData } from '@/lib/dashboard/server-data';
import { HomeDashboardHeader, ContinueHero } from '@/app/components/home';
import CategoryDashboardTabs from '@/app/components/dashboard/CategoryDashboardTabs';
import UnifiedOverviewRow from '@/app/components/dashboard/UnifiedOverviewRow';
import type { UnifiedOverviewCategory } from '@/lib/dashboard/unified-overview';
import type { UnifiedOverviewInput } from '@/lib/dashboard/unified-overview';

type HomeDashboardContentProps = {
  username: string;
  displayName?: string | null;
  stats: PersonalStats;
  mediaCategories: DashboardCategoryKey[];
  categorySections?: Record<DashboardCategoryKey, CategoryDashboardSection>;
  continueData?: ContinueData;
  showSections?: boolean;
};

export default function HomeDashboardContent({
  username,
  displayName,
  stats,
  mediaCategories,
  categorySections,
  continueData,
  showSections = true,
}: HomeDashboardContentProps) {
  return (
    <main className="pt-2 md:pt-3">
      <HomeDashboardHeader username={username} displayName={displayName} />

      {mediaCategories.length === 0 && (
        <section>
          <div className="mx-auto max-w-screen-2xl px-4 md:px-6">
            <div className="rounded-xl border border-border/40 bg-card/70 p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="text-base font-semibold tracking-[-0.01em]">
                      Turn on categories to activate your dashboard
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    To see personalized stats, suggestions, and recommendations, enable the
                    categories you care about in your profile settings.
                  </p>
                </div>
                <Button asChild variant="primary" className="h-10 whitespace-nowrap">
                  <Link href="/profile/edit#categories">
                    Edit categories
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="pt-2 md:pt-3">
        <ContinueHero fallbackData={continueData} />
      </section>

      {showSections && categorySections && (
        <HomeDashboardSections
          mediaCategories={mediaCategories}
          categorySections={categorySections}
          stats={stats}
        />
      )}
    </main>
  );
}

type HomeDashboardSectionsProps = {
  mediaCategories: DashboardCategoryKey[];
  categorySections: Record<DashboardCategoryKey, CategoryDashboardSection>;
  stats: PersonalStats;
};

function buildUnifiedOverviewCategories(
  mediaCategories: DashboardCategoryKey[],
  categorySections: Record<DashboardCategoryKey, CategoryDashboardSection>,
  stats: PersonalStats,
): UnifiedOverviewCategory[] {
  const resolveStatsForCategory = (category: DashboardCategoryKey) => {
    if (category === 'games') {
      return stats.games;
    }
    if (category === 'anime') {
      return stats.anime;
    }
    if (category === 'manga') {
      return stats.manga;
    }
    if (category === 'movies') {
      return stats.movies;
    }
    if (category === 'tv') {
      return stats.tv;
    }
    return stats.books;
  };

  return DASHBOARD_TAB_CATEGORIES.map(category => {
    const categoryStats = resolveStatsForCategory(category);
    const recentlyFinished = Math.max(
      0,
      categorySections[category]?.insights?.updatedLast7Days ?? 0,
    );

    return {
      key: category,
      enabled: mediaCategories.includes(category),
      inProgress: categoryStats.in_progress ?? 0,
      completed: categoryStats.completed ?? 0,
      recentlyFinished,
    };
  });
}

export function HomeDashboardSections({
  mediaCategories,
  categorySections,
  stats,
}: HomeDashboardSectionsProps) {
  const overviewData: UnifiedOverviewInput = {
    categories: buildUnifiedOverviewCategories(mediaCategories, categorySections, stats),
    totalMinutes: Math.max(0, (stats.total_hours ?? 0) * 60),
    hasFullTimeCoverage: true,
  };

  return (
    <>
      {mediaCategories.length > 0 && (
        <section className="mt-10 md:mt-12">
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6">
            <UnifiedOverviewRow data={overviewData} />
            <CategoryDashboardTabs
              enabledCategories={mediaCategories}
              sections={categorySections}
              stats={stats}
            />
          </div>
        </section>
      )}
    </>
  );
}
