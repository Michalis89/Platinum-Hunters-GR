import { redirect } from 'next/navigation';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getUserSettings } from '@/lib/settings';
import { PageContainer } from '@/app/components/layout';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import { fetchUserStats } from '@/lib/dashboard/server-data';
import { DASHBOARD_TAB_CATEGORIES } from '@/lib/dashboard/category-data';
import type { DashboardCategoryKey } from '@/lib/dashboard/category-data';
import { HomeSocialSection } from '@/app/components/home/HomeSocialSection';

export const metadata = buildMetadata({
  title: 'Explore',
  description: 'Discover what the community is enjoying',
  path: '/explore',
  noindex: true,
});

export default async function ExplorePage() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  const userId = session.user.id;
  const settings = await getUserSettings(userId, { supabase });

  if (!settings.social_profile_enabled) {
    redirect('/settings');
  }

  const stats = await fetchUserStats(userId);
  const enabledCategories = (stats.active_categories ?? []).filter(
    (category): category is DashboardCategoryKey =>
      DASHBOARD_TAB_CATEGORIES.includes(category as DashboardCategoryKey),
  );

  const showSuggestions = settings.community_suggestions_enabled && enabledCategories.length > 0;
  const showActivity = settings.community_activity_enabled;

  return (
    <main className="pb-10 pt-6 md:pb-16 md:pt-8">
      <PageContainer size="lg" className="space-y-6">
        <PageHeader
          title="Explore"
          description="Discover what the community is enjoying"
          eyebrow="Community"
          align="left"
        />
      </PageContainer>

      <HomeSocialSection
        enabledCategories={enabledCategories}
        showSuggestions={showSuggestions}
        showActivity={showActivity}
      />
    </main>
  );
}
