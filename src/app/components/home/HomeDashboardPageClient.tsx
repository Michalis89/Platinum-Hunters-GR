'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useSWR from 'swr';
import { selectUser } from '@/store/slices/authSlice';
import { PageContainer } from '@/app/components/layout';
import { apiClient } from '@/lib/api/client';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
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
    <div className="pb-12">
      <HomeDashboardHeader
        username={user?.username ?? 'Χρήστη'}
        displayName={user?.display_name}
      />

      <ContinueHero />

      <HomeStatsRow stats={personalStats?.data} enabledCategories={mediaCategories} />

      <HomeQuickActions />

      {mediaCategories.length > 0 && <HomeSuggestions enabledCategories={mediaCategories} />}

      <HomeRecentActivity scope="global" />
    </div>
  );
}

function HomeDashboardLoadingShell() {
  return (
    <div className="min-h-[80vh] pb-12">
      <section className="px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="animate-pulse space-y-2">
              <div className="h-4 w-20 rounded bg-[var(--hb-card)]/60" />
              <div className="h-8 w-64 rounded bg-[var(--hb-card)]/70" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-24 animate-pulse rounded-full bg-[var(--hb-card)]/50" />
              <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--hb-card)]/50" />
              <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--hb-card)]/50" />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="min-h-[300px] animate-pulse rounded-[28px] border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6">
            <div className="grid min-h-[260px] items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
              <div className="space-y-4">
                <div className="h-4 w-24 rounded bg-[var(--hb-card)]/60" />
                <div className="h-8 w-3/4 rounded bg-[var(--hb-card)]/70" />
                <div className="h-4 w-1/2 rounded bg-[var(--hb-card)]/50" />
                <div className="flex gap-3 pt-4">
                  <div className="h-12 w-32 rounded-full bg-[var(--hb-card)]/60" />
                  <div className="h-12 w-48 rounded-full bg-[var(--hb-card)]/40" />
                </div>
              </div>
              <div className="aspect-[4/5] w-full rounded-2xl bg-[var(--hb-card)]/30 md:w-[340px]" />
            </div>
          </div>
        </div>
      </section>

      <PageContainer size="xl">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-24 animate-pulse rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)]/40" />
          <div className="h-24 animate-pulse rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)]/40" />
          <div className="h-24 animate-pulse rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)]/40" />
        </div>
      </PageContainer>
    </div>
  );
}

