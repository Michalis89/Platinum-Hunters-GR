'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import useSWR from 'swr';
import { Sparkles, ArrowRight } from 'lucide-react';
import { selectUser } from '@/store/slices/authSlice';
import { PageContainer } from '@/app/components/layout';
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

function scheduleAfterPaint(callback: () => void): () => void {
  if (typeof requestIdleCallback !== 'undefined') {
    const id = requestIdleCallback(callback, { timeout: 2000 });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(callback, 50);
  return () => clearTimeout(id);
}

const hasContinuePayload = (
  value: DashboardViewProps['continueData'],
): value is { enabledCategories?: string[] } =>
  !!value && typeof value === 'object' && 'enabledCategories' in value;

export default function HomeDashboardPageClient() {
  const user = useSelector(selectUser);
  const [hasMounted, setHasMounted] = useState(false);
  const [canFetch, setCanFetch] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    // Middleware ensures only authenticated users reach this page
    const cancel = scheduleAfterPaint(() => setCanFetch(true));
    return cancel;
  }, []);

  const { data: personalStats } = useSWR<{ data?: PersonalStats }>(
    canFetch ? '/api/user/stats' : null,
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    },
  );

  const { data: continueData } = useSWR<DashboardViewProps['continueData']>(
    canFetch ? '/api/user/continue' : null,
    noStoreFetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    },
  );

  if (!hasMounted) {
    return <HomeDashboardLoadingShell />;
  }

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
        <ContinueHero />
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

function HomeDashboardLoadingShell() {
  return (
    <div className="min-h-[80vh] pb-14 pt-2 md:pb-16 md:pt-3">
      <section className="px-4 pb-8 pt-12 md:px-6 md:pb-8 md:pt-16">
        <div className="mx-auto max-w-screen-2xl">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-20 rounded bg-card" />
            <div className="h-10 w-72 rounded bg-accent/15" />
            <div className="h-4 w-96 max-w-full rounded bg-card" />
          </div>
        </div>
      </section>

      <section className="px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto max-w-screen-2xl">
          <div className="min-h-[304px] animate-pulse p-6 md:p-8">
            <div className="grid min-h-[260px] items-center gap-7 md:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
              <div className="space-y-4">
                <div className="h-4 w-24 rounded bg-card" />
                <div className="h-8 w-3/4 rounded bg-accent/15" />
                <div className="h-4 w-1/2 rounded bg-card" />
                <div className="flex gap-3 pt-4">
                  <div className="h-11 w-28 rounded-full bg-card" />
                  <div className="h-11 w-44 rounded-full bg-card" />
                </div>
              </div>
              <div className="aspect-[4/5] w-full rounded-2xl bg-card md:w-[340px]" />
            </div>
          </div>
        </div>
      </section>

      <PageContainer size="xl">
        <div className="grid gap-3.5 md:grid-cols-4 md:gap-4">
          <div className="h-24 animate-pulse bg-card" />
          <div className="h-24 animate-pulse bg-card" />
          <div className="h-24 animate-pulse bg-card" />
          <div className="h-24 animate-pulse bg-card" />
        </div>
      </PageContainer>
    </div>
  );
}

