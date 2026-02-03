'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSWR from 'swr';
import { selectIsAuthenticated, selectIsLoading, selectUser, setUser } from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';
import { supabase } from '@/lib/supabase-client';
import { PageContainer } from '@/app/components/layout';

// Guest components
import {
  HomeHero,
  HomeFeatures,
  HomeHowItWorks,
  HomeRoadmapPreview,
  HomeFinalCTA,
} from '@/app/components/home';

// Dashboard components
import {
  HomeDashboardHeader,
  HomeStatsRow,
  HomeQuickActions,
  HomeRecentActivity,
  HomeSuggestions,
  ContinueHero,
} from '@/app/components/home';

const fetcher = (url: string) => fetch(url).then(res => res.json());
const noStoreFetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(res => res.json());

/**
 * Schedules a callback to run after first paint using requestIdleCallback
 * with a fallback to setTimeout for browsers that don't support it.
 */
function scheduleAfterPaint(callback: () => void): () => void {
  if (typeof requestIdleCallback !== 'undefined') {
    const id = requestIdleCallback(callback, { timeout: 2000 });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(callback, 50);
  return () => clearTimeout(id);
}

export default function HomePageClient() {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAuthLoading = useSelector(selectIsLoading);
  const user = useSelector(selectUser);

  // Prevent hydration mismatch by waiting for client mount
  const [hasMounted, setHasMounted] = useState(false);

  // Defer data fetching until after first paint to improve INP
  const [canFetch, setCanFetch] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Defer SWR fetches until after first paint using requestIdleCallback
  useEffect(() => {
    if (!isAuthenticated) return;
    const cancel = scheduleAfterPaint(() => setCanFetch(true));
    return cancel;
  }, [isAuthenticated]);

  // Deferred data fetching - only starts after first paint
  const { data: personalStats } = useSWR(
    canFetch ? '/api/user/stats' : null,
    fetcher,
    {
      refreshInterval: 120000,
      revalidateOnFocus: false,
    }
  );

  const { data: continueData } = useSWR(
    canFetch ? '/api/user/continue' : null,
    noStoreFetcher,
    {
      refreshInterval: 120000,
      revalidateOnFocus: true,
    },
  );

  // Heartbeat for authenticated users - also deferred
  useEffect(() => {
    if (!canFetch) return;

    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;

      fetch('/api/activity/heartbeat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (res.status === 401) {
            supabase.auth.getSession().then(({ data: refreshed }) => {
              if (!refreshed.session) {
                dispatch(setUser(null));
              }
            });
          }
        })
        .catch(() => {});
    });
  }, [canFetch, dispatch]);

  // Render a stable shell while auth is loading to prevent CLS.
  // The shell has min-height to reserve space and prevent layout shift.
  if (!hasMounted || isAuthLoading) {
    return <HomeShellLoading />;
  }

  return (
    <>
      {isAuthenticated ? (
        <DashboardView
          username={user?.username ?? 'Χρήστη'}
          displayName={user?.display_name}
          stats={personalStats?.data}
          continueData={continueData}
        />
      ) : (
        <GuestView />
      )}
    </>
  );
}

// Guest landing page
function GuestView() {
  return (
    <>
      <HomeHero />

      <PageContainer size="xl">
        <HomeFeatures />
      </PageContainer>

      <HomeHowItWorks />

      <PageContainer size="xl">
        <HomeRoadmapPreview />
      </PageContainer>

      <HomeFinalCTA />
    </>
  );
}

// Minimal shell rendered during hydration before auth resolves.
// Uses min-height to reserve space and prevent CLS when content loads.
function HomeShellLoading() {
  return (
    <div className="min-h-[80vh] pb-12">
      {/* Header skeleton - matches HomeDashboardHeader height */}
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

      {/* ContinueHero skeleton - matches min-h-[300px] + padding */}
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

      {/* Stats skeleton */}
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

// Logged-in dashboard
export type CategoryStats = {
  total: number;
  in_progress: number;
  completed: number;
  dropped: number;
  hours: number;
};

export type PersonalStats = {
  total_backlog: number;
  in_progress: number;
  completed: number;
  total_hours: number;
  games: CategoryStats;
  anime: CategoryStats;
  manga: CategoryStats & { chapters: number };
  movies: CategoryStats;
  tv: CategoryStats;
  books: CategoryStats & { pages: number };
  active_categories: string[];
};

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

function DashboardView({ username, displayName, stats, continueData }: DashboardViewProps) {
  const continuePayload =
    continueData && 'data' in continueData ? continueData.data : hasContinuePayload(continueData)
      ? continueData
      : undefined;
  const enabledCategories = (continuePayload?.enabledCategories ?? []).filter(cat =>
    ['games', 'anime', 'manga', 'movies', 'tv', 'books'].includes(cat),
  );
  const fallbackCategories = (stats?.active_categories ?? []).filter(cat =>
    ['games', 'anime', 'manga', 'movies', 'tv', 'books'].includes(cat),
  );
  const mediaCategories = enabledCategories.length > 0 ? enabledCategories : fallbackCategories;

  return (
    <div className="pb-12">
      <HomeDashboardHeader username={username} displayName={displayName} />

      <ContinueHero />

      <HomeStatsRow stats={stats} enabledCategories={mediaCategories} />

      <HomeQuickActions />

      {mediaCategories.length > 0 && <HomeSuggestions enabledCategories={mediaCategories} />}

      <HomeRecentActivity scope="global" />
    </div>
  );
}
