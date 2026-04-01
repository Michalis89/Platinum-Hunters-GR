import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import getSupabaseServer from '@/lib/supabase-server';
import { fetchUserStats, fetchContinueData } from '@/lib/dashboard/server-data';
import {
  DASHBOARD_TAB_CATEGORIES,
  fetchCategoryDashboardData,
  type DashboardCategoryKey,
} from '@/lib/dashboard/category-data';
import { HomeDashboardSections } from '@/app/components/home/HomeDashboardSections';

export const revalidate = 120;

type PageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username}'s Dashboard | Hobbistas`,
    description: `Read-only dashboard view for ${username}.`,
    robots: { index: false },
  };
}

export default async function PublicDashboardPage({ params }: PageProps) {
  const { username } = await params;
  const supabase = getSupabaseServer();

  const { data: user } = await supabase
    .from('users')
    .select('id,username,display_name,privacy_settings')
    .eq('username', username)
    .maybeSingle();

  if (!user) {
    notFound();
  }

  const privacy = user.privacy_settings as { profile_visibility?: string } | null;
  if (privacy?.profile_visibility === 'private') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-2xl font-semibold text-foreground">Private Profile</p>
        <p className="mt-2 text-muted-foreground">
          This dashboard is private. Ask the user for a share link.
        </p>
      </div>
    );
  }

  const [stats, continueData] = await Promise.all([
    fetchUserStats(supabase, user.id),
    fetchContinueData(supabase, user.id),
  ]);

  const requestedCategories = (continueData.enabledCategories ?? []).filter(
    (category): category is DashboardCategoryKey =>
      DASHBOARD_TAB_CATEGORIES.includes(category as DashboardCategoryKey),
  );
  const fallbackCategories = (stats.active_categories ?? []).filter(
    (category): category is DashboardCategoryKey =>
      DASHBOARD_TAB_CATEGORIES.includes(category as DashboardCategoryKey),
  );
  const mediaCategories = requestedCategories.length > 0 ? requestedCategories : fallbackCategories;
  const sections = await fetchCategoryDashboardData(supabase, user.id, mediaCategories);
  const displayName = user.display_name ?? user.username;

  return (
    <div className="w-full px-2 pb-10 pt-2 md:px-4 md:pb-14 md:pt-4">
      <section className="px-4 pb-8 pt-12 md:px-6 md:pb-10 md:pt-16">
        <div className="mx-auto max-w-screen-2xl space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Public dashboard view</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {displayName}&apos;s Dashboard
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            Read-only insights, favorites, and recommendations.
          </p>
        </div>
      </section>

      <HomeDashboardSections
        mediaCategories={mediaCategories}
        categorySections={sections}
        stats={stats}
        isReadOnly
      />
    </div>
  );
}
