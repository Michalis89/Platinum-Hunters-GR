'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useSWR from 'swr';
import { selectUser } from '@/store/slices/authSlice';
import { PageContainer } from '@/app/components/layout';
import { apiClient } from '@/lib/api/client';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { Separator } from '@/components/ui/separator';
import type { PersonalStats } from './types';
import {
  HomeDashboardHeader,
  HomeStatsRow,
  HomeQuickActions,
  HomeRecentActivity,
  HomeSuggestions,
  ContinueHero,
} from '@/app/components/home';

const fetcher = apiClient.swrFetcher;
const noStoreFetcher = apiClient.swrNoStoreFetcher;
const SECTION_SPACING = 'pt-10 md:pt-12';
const DIVIDER_WRAP = 'mx-auto mt-8 max-w-7xl px-4 md:mt-10 md:px-6';
const DIVIDER_STYLE = 'apple-section-divider';

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
  const { isAuthenticated, isLoading: isAuthLoading } = useRequireAuth();
  const user = useSelector(selectUser);
  const [hasMounted, setHasMounted] = useState(false);
  const [canFetch, setCanFetch] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const cancel = scheduleAfterPaint(() => setCanFetch(true));
    return cancel;
  }, [isAuthenticated]);

  const { data: personalStats } = useSWR<{ data?: PersonalStats }>(
    canFetch ? '/api/user/stats' : null,
    fetcher,
    {
      refreshInterval: 120000,
      revalidateOnFocus: false,
    },
  );

  const { data: continueData } = useSWR<DashboardViewProps['continueData']>(
    canFetch ? '/api/user/continue' : null,
    noStoreFetcher,
    {
      refreshInterval: 120000,
      revalidateOnFocus: true,
    },
  );

  if (!hasMounted || isAuthLoading || !isAuthenticated) {
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
      <HomeDashboardHeader username={user?.username ?? 'Χρήστη'} displayName={user?.display_name} />

      <section className="pt-2 md:pt-3">
        <ContinueHero />
      </section>

      <section className={SECTION_SPACING}>
        <HomeStatsRow stats={personalStats?.data} enabledCategories={mediaCategories} />
      </section>
      <div className={DIVIDER_WRAP}>
        <Separator className={DIVIDER_STYLE} />
      </div>

      <section className={SECTION_SPACING}>
        <HomeQuickActions />
      </section>
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
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-20 rounded bg-[var(--apple-tertiary-fill)]" />
            <div className="h-10 w-72 rounded bg-[color-mix(in_srgb,var(--apple-tertiary-fill)_88%,var(--apple-system-blue)_12%)]" />
            <div className="h-4 w-96 max-w-full rounded bg-[var(--apple-tertiary-fill)]" />
          </div>
        </div>
      </section>

      <section className="px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="apple-material-surface min-h-[304px] animate-pulse p-6 md:p-8">
            <div className="grid min-h-[260px] items-center gap-7 md:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
              <div className="space-y-4">
                <div className="h-4 w-24 rounded bg-[var(--apple-tertiary-fill)]" />
                <div className="h-8 w-3/4 rounded bg-[color-mix(in_srgb,var(--apple-tertiary-fill)_88%,var(--apple-system-blue)_12%)]" />
                <div className="h-4 w-1/2 rounded bg-[var(--apple-tertiary-fill)]" />
                <div className="flex gap-3 pt-4">
                  <div className="h-11 w-28 rounded-full bg-[var(--apple-tertiary-fill)]" />
                  <div className="h-11 w-44 rounded-full bg-[var(--apple-tertiary-fill)]" />
                </div>
              </div>
              <div className="aspect-[4/5] w-full rounded-2xl bg-[var(--apple-tertiary-fill)] md:w-[340px]" />
            </div>
          </div>
        </div>
      </section>

      <PageContainer size="xl">
        <div className="grid gap-3.5 md:grid-cols-4 md:gap-4">
          <div className="apple-card h-24 animate-pulse bg-[var(--apple-tertiary-fill)]" />
          <div className="apple-card h-24 animate-pulse bg-[var(--apple-tertiary-fill)]" />
          <div className="apple-card h-24 animate-pulse bg-[var(--apple-tertiary-fill)]" />
          <div className="apple-card h-24 animate-pulse bg-[var(--apple-tertiary-fill)]" />
        </div>
      </PageContainer>
    </div>
  );
}
