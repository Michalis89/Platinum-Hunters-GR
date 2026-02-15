'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { PersonalStats } from './types';
import type { CategoryDashboardSection, DashboardCategoryKey } from '@/lib/dashboard/category-data';
import { HomeDashboardHeader, ContinueHero } from '@/app/components/home';
import CategoryDashboardTabs from '@/app/components/dashboard/CategoryDashboardTabs';

const DIVIDER_WRAP = 'mx-auto mt-12 max-w-screen-2xl px-4 md:mt-14 md:px-6';
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
    <main className="pb-20 pt-2 md:pb-24 md:pt-3">
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

      <section className="pt-1 md:pt-2">
        <ContinueHero />
      </section>

      {mediaCategories.length > 0 && (
        <>
          <section className="mt-12 md:mt-14">
            <CategoryDashboardTabs
              enabledCategories={mediaCategories}
              sections={categorySections}
              stats={stats}
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
