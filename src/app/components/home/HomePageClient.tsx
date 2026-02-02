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

export default function HomePageClient() {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAuthLoading = useSelector(selectIsLoading);
  const user = useSelector(selectUser);

  // Prevent hydration mismatch by waiting for client mount
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const { data: personalStats } = useSWR(isAuthenticated ? '/api/user/stats' : null, fetcher, {
    refreshInterval: 120000,
    revalidateOnFocus: false,
  });

  const { data: continueData } = useSWR(
    isAuthenticated ? '/api/user/continue' : null,
    noStoreFetcher,
    {
      refreshInterval: 120000,
      revalidateOnFocus: true,
    },
  );

  // Heartbeat for authenticated users
  useEffect(() => {
    if (!isAuthenticated) return;

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
  }, [isAuthenticated, dispatch]);

  // Show GuestView during SSR and initial hydration to prevent mismatch
  // Once mounted and auth is loaded, show the correct view
  if (!hasMounted || isAuthLoading) {
    return <GuestView />;
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
