'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import useSWR from 'swr';
import { Sparkles, ArrowRight } from 'lucide-react';
import { selectUser } from '@/store/slices/authSlice';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { PersonalStats } from './types';
import {
  HomeDashboardHeader,
  HomeRecentActivity,
  HomeSuggestions,
  ContinueHero,
} from '@/app/components/home';
import type { ContinuePayload } from './ContinueHero';

const fetcher = apiClient.swrFetcher;
const noStoreFetcher = apiClient.swrNoStoreFetcher;
const SECTION_SPACING = 'pt-10 md:pt-12';
const DIVIDER_WRAP = 'mx-auto mt-8 max-w-screen-2xl px-4 md:mt-10 md:px-6';
const DIVIDER_STYLE = '';

type DashboardViewProps = {
  username: string;
  displayName?: string | null;
  stats?: PersonalStats;
  continueData?: { data?: { enabledCategories?: string[] } } | { enabledCategories?: string[] };
};

const hasContinuePayload = (
  value: DashboardViewProps['continueData'],
): value is { enabledCategories?: string[] } =>
  !!value && typeof value === 'object' && 'enabledCategories' in value;

export default function HomeDashboardPageClient() {
  const user = useSelector(selectUser);

  const { data: personalStats } = useSWR<{ data?: PersonalStats }>(
    '/api/user/stats',
    fetcher,
    {
      refreshInterval: 0,
    },
  );

  const { data: continueData } = useSWR<DashboardViewProps['continueData']>(
    '/api/user/continue',
    noStoreFetcher,
    {
      refreshInterval: 0,
    },
  );

  const continuePayload =
    continueData && 'data' in continueData
      ? continueData.data
      : hasContinuePayload(continueData)
        ? continueData
        : undefined;
  const enabledCategories = (continuePayload?.enabledCategories ?? []).filter(cat =>
    ['games', 'anime', 'manga', 'movies', 'tv', 'books'].includes(cat),
  );
  const fallbackCategories = (personalStats?.data?.active_categories ?? []).filter(cat =>
    ['games', 'anime', 'manga', 'movies', 'tv', 'books'].includes(cat),
  );
  const mediaCategories = enabledCategories.length > 0 ? enabledCategories : fallbackCategories;

  return (
    <main className="pb-16 pt-2 md:pb-20 md:pt-3">
      <HomeDashboardHeader username={user?.username ?? 'User'} displayName={user?.display_name} />

      {mediaCategories.length === 0 && (
        <section className={SECTION_SPACING}>
          <div className="mx-auto max-w-screen-2xl px-4 md:px-6">
            <div className="rounded-lg border p-5 md:p-6">
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
        <ContinueHero fallbackData={continuePayload as ContinuePayload | undefined} />
      </section>

      <div className={DIVIDER_WRAP}>
        <Separator className={DIVIDER_STYLE} />
      </div>

      <div className={DIVIDER_WRAP}>
        <Separator className={DIVIDER_STYLE} />
      </div>

      {mediaCategories.length > 0 && (
        <section className={SECTION_SPACING}>
          <HomeSuggestions enabledCategories={mediaCategories} />
        </section>
      )}
      {mediaCategories.length > 0 && (
        <div className={DIVIDER_WRAP}>
          <Separator className={DIVIDER_STYLE} />
        </div>
      )}

      <section className={SECTION_SPACING}>
        <HomeRecentActivity scope="global" />
      </section>
    </main>
  );
}

