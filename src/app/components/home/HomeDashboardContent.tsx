'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { PersonalStats } from './types';
import type { CategoryDashboardSection, DashboardCategoryKey } from '@/lib/dashboard/category-data';
import { HomeDashboardHeader, HomeStatsRow, ContinueHero } from '@/app/components/home';
import CategoryDashboardTabs from '@/app/components/dashboard/CategoryDashboardTabs';

const SECTION_SPACING = 'pt-10 md:pt-12';
const DIVIDER_WRAP = 'mx-auto mt-8 max-w-7xl px-4 md:mt-10 md:px-6';
const DIVIDER_STYLE = '';
const HomeSocialSection = dynamic(
  () => import('./HomeSocialSection').then(mod => mod.HomeSocialSection),
  {
    ssr: false,
  },
);

type SocialPreferences = {
  socialEnabled: boolean;
  communityActivityEnabled: boolean;
  communitySuggestionsEnabled: boolean;
};

type HomeDashboardContentProps = {
  username: string;
  displayName?: string | null;
  stats: PersonalStats;
  mediaCategories: DashboardCategoryKey[];
  categorySections: Record<DashboardCategoryKey, CategoryDashboardSection>;
  socialPreferences: SocialPreferences;
};

export default function HomeDashboardContent({
  username,
  displayName,
  stats,
  mediaCategories,
  categorySections,
  socialPreferences,
}: HomeDashboardContentProps) {
  const { socialEnabled, communityActivityEnabled, communitySuggestionsEnabled } =
    socialPreferences;
  const suggestionSectionVisible = communitySuggestionsEnabled && mediaCategories.length > 0;
  const activitySectionVisible = communityActivityEnabled;
  const showSocialSection = socialEnabled && (suggestionSectionVisible || activitySectionVisible);

  return (
    <main className="pb-16 pt-2 md:pb-20 md:pt-3">
      <HomeDashboardHeader username={username} displayName={displayName} />

      {mediaCategories.length === 0 && (
        <section className={SECTION_SPACING}>
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="rounded-lg border p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-foreground">
                    <Sparkles className="h-4 w-4 text-info" />
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
                  <Link href="/pages/profile/edit#categories">
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
        <ContinueHero />
      </section>

      <section className={SECTION_SPACING}>
        <HomeStatsRow stats={stats} enabledCategories={mediaCategories} />
      </section>
      <div className={DIVIDER_WRAP}>
        <Separator className={DIVIDER_STYLE} />
      </div>

      {mediaCategories.length > 0 && (
        <>
          <div className={DIVIDER_WRAP}>
            <Separator className={DIVIDER_STYLE} />
          </div>
          <section className={SECTION_SPACING}>
            <CategoryDashboardTabs
              enabledCategories={mediaCategories}
              sections={categorySections}
            />
          </section>
        </>
      )}
      {showSocialSection && (
        <>
          <div className={DIVIDER_WRAP}>
            <Separator className={DIVIDER_STYLE} />
          </div>
          <HomeSocialSection
            enabledCategories={mediaCategories}
            showSuggestions={suggestionSectionVisible}
            showActivity={activitySectionVisible}
          />
        </>
      )}
    </main>
  );
}
