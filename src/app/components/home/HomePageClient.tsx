'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSWR from 'swr';
import { selectIsAuthenticated, selectUser, setUser } from '@/store/slices/authSlice';
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
  HomeContinue,
  HomeSuggestions,
} from '@/app/components/home';

const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * HomePageClient - Main home page with guest/authenticated views.
 *
 * Note: Background gradient and Footer are now provided by AppShell.
 * This component only needs to render its content.
 */
export default function HomePageClient() {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  const { data: personalStats } = useSWR(isAuthenticated ? '/api/user/stats' : null, fetcher, {
    refreshInterval: 120000,
    revalidateOnFocus: false,
  });

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

  return (
    <>
      {isAuthenticated ? (
        <DashboardView
          username={user?.username ?? 'Χρήστη'}
          displayName={user?.display_name}
          stats={personalStats?.data}
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
type CategoryStats = {
  total: number;
  in_progress: number;
  completed: number;
  hours: number;
};

type PersonalStats = {
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
};

function DashboardView({ username, displayName, stats }: DashboardViewProps) {
  // Filter to media categories only (not games) for suggestions
  const mediaCategories = (stats?.active_categories ?? []).filter(cat =>
    ['anime', 'manga', 'movies', 'tv', 'books'].includes(cat),
  );

  return (
    <div className="pb-16">
      <HomeDashboardHeader username={username} displayName={displayName} />

      <HomeStatsRow stats={stats} />

      <HomeQuickActions />

      <HomeContinue />

      {mediaCategories.length > 0 && <HomeSuggestions activeCategories={mediaCategories} />}

      <HomeRecentActivity scope="global" />
    </div>
  );
}
