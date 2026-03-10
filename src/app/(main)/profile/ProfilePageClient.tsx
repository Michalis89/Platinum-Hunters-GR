'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { Skeleton } from '@/components/ui/skeleton';
import { selectUser } from '@/store/slices/authSlice';
import { hasAnyRole } from '@/lib/roles';
import { supabase } from '@/lib/supabase-client';
import { useUserSettings } from '@/lib/settings/useUserSettings';
import { AboutSection, AccountInfo, GenreAffinity, HobbySection, ProfileHero } from '@/app/components/profile';
import { getEnabledCategories, resolveProfileIdentity } from '@/app/components/profile/profileData';

const ActivityTimeline = dynamic(
  () => import('@/app/components/profile/ActivityTimeline').then(mod => mod.ActivityTimeline),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full rounded-2xl" />,
  },
);

const ContentList = dynamic(
  () => import('@/app/components/profile/ContentList').then(mod => mod.ContentList),
  {
    ssr: false,
    loading: () => <Skeleton className="h-80 w-full rounded-2xl" />,
  },
);

type HeroStats = {
  articles: number | null;
  reviews: number | null;
  entries: number | null;
  lists: number | null;
};

function MobileCollapse({
  title,
  children,
}: Readonly<{
  title: string;
  children: ReactNode;
}>) {
  return (
    <details className="group rounded-2xl border border-border/60 bg-card/35 lg:hidden" open>
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-foreground">
        {title}
      </summary>
      <div className="px-2 pb-2">{children}</div>
    </details>
  );
}

function ProfilePageSkeleton() {
  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 space-y-5 lg:col-span-8">
            <Skeleton className="h-[28rem] w-full rounded-2xl" />
            <Skeleton className="h-80 w-full rounded-2xl" />
            <Skeleton className="h-[32rem] w-full rounded-2xl" />
          </div>
          <div className="col-span-12 space-y-5 lg:col-span-4">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-60 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePageClient() {
  const user = useSelector(selectUser);
  const { settings } = useUserSettings(!!user);
  const socialLayerEnabled = settings?.social_enabled ?? true;
  const isPrivileged = hasAnyRole(user, ['admin', 'owner', 'author', 'reviewer']);
  const [authUser, setAuthUser] = useState<SupabaseAuthUser | null>(null);
  const [heroStats, setHeroStats] = useState<HeroStats>({
    articles: null,
    reviews: null,
    entries: null,
    lists: null,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }
    let cancelled = false;
    setLoadingStats(true);
    Promise.all([
      fetch('/api/articles?author_id=me&status=published&topic=articles&limit=1').then(r =>
        r.ok ? r.json() : null,
      ),
      fetch('/api/articles?author_id=me&status=published&topic=reviews&limit=1').then(r =>
        r.ok ? r.json() : null,
      ),
    ])
      .then(([articleResult, reviewResult]) => {
        if (cancelled) {
          return;
        }
        setHeroStats({
          articles: Number(articleResult?.meta?.total ?? 0),
          reviews: Number(reviewResult?.meta?.total ?? 0),
          entries: null,
          lists: null,
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setLoadingStats(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setAuthUser(null);
      return;
    }

    let cancelled = false;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!cancelled) {
          setAuthUser(data.user ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuthUser(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const categories = useMemo(
    () => getEnabledCategories(user, isPrivileged, socialLayerEnabled),
    [isPrivileged, socialLayerEnabled, user],
  );
  const identity = useMemo(
    () => (user ? resolveProfileIdentity(user, authUser) : null),
    [authUser, user],
  );

  if (!user) {
    return <ProfilePageSkeleton />;
  }

  return (
    <main className="px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <ProfileHero user={user} identity={identity} stats={heroStats} loadingStats={loadingStats} />

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 space-y-5 lg:col-span-8">
            <HobbySection
              categories={categories}
              categoryProfile={user.category_profile}
              genreAffinity={user.genre_affinity}
              showPsnId={user.privacy_settings?.show_psn_id ?? true}
            />
            <ActivityTimeline />
            {isPrivileged ? <ContentList /> : null}

            <MobileCollapse title="About">
              <AboutSection user={user} identity={identity} />
            </MobileCollapse>
            <MobileCollapse title="Genre Affinity">
              <GenreAffinity genreAffinity={user.genre_affinity} />
            </MobileCollapse>
            <MobileCollapse title="Account Info">
              <AccountInfo user={user} identity={identity} />
            </MobileCollapse>
          </div>

          <aside className="col-span-12 hidden lg:col-span-4 lg:block">
            <div className="space-y-5 lg:sticky lg:top-24">
              <AboutSection user={user} identity={identity} />
              <GenreAffinity genreAffinity={user.genre_affinity} />
              <AccountInfo user={user} identity={identity} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
