'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PersonalStats } from './types';
import type { DashboardCategoryKey } from '@/lib/dashboard/category-data';
import type { ContinueData } from '@/lib/dashboard/server-data';
import { HomeDashboardHeader, ContinueHero } from '@/app/components/home';

type HomeDashboardContentProps = {
  username: string;
  displayName?: string | null;
  stats: PersonalStats;
  mediaCategories: DashboardCategoryKey[];
  continueData?: ContinueData;
};

export default function HomeDashboardContent({
  username,
  displayName,
  mediaCategories,
  continueData,
}: Readonly<HomeDashboardContentProps>) {
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
    </main>
  );
}
