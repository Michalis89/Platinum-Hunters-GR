'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSWR from 'swr';
import { selectIsAuthenticated, selectUser, setUser } from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';
import { supabase } from '@/lib/supabase-client';
import VersionBadge from '@/app/components/ui/VersionBadge';
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
} from '@/app/components/home';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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

  const { data: analytics } = useSWR('/api/analytics/summary', fetcher, {
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
        .then((res) => {
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
          analytics={analytics}
        />
      ) : (
        <GuestView />
      )}
      <VersionBadge />
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
type DashboardViewProps = {
  username: string;
  displayName?: string | null;
  analytics?: {
    total_users?: number;
    active_users_now?: number;
    total_guides?: number;
    total_games?: number;
  };
};

function DashboardView({ username, displayName, analytics }: DashboardViewProps) {
  return (
    <div className="pb-16">
      <HomeDashboardHeader username={username} displayName={displayName} />

      <HomeStatsRow
        totalUsers={analytics?.total_users ?? '–'}
        activeNow={analytics?.active_users_now ?? '–'}
        totalGuides={analytics?.total_guides ?? '–'}
        totalGames={analytics?.total_games ?? '–'}
      />

      <HomeQuickActions />

      <HomeContinue />

      <HomeRecentActivity scope="global" />
    </div>
  );
}
