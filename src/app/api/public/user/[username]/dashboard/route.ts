import { NextResponse } from 'next/server';
import getSupabaseServer from '@/lib/supabase-server';
import { fetchUserStats, fetchContinueData } from '@/lib/dashboard/server-data';
import {
  DASHBOARD_TAB_CATEGORIES,
  fetchCategoryDashboardData,
  type DashboardCategoryKey,
} from '@/lib/dashboard/category-data';

export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const supabase = getSupabaseServer();

    const { data: user } = await supabase
      .from('users')
      .select('id,username,display_name,privacy_settings')
      .eq('username', username)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const privacy = user.privacy_settings as { profile_visibility?: string } | null;
    if (privacy?.profile_visibility === 'private') {
      return NextResponse.json({ error: 'Profile is private' }, { status: 403 });
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
    const mediaCategories =
      requestedCategories.length > 0 ? requestedCategories : fallbackCategories;
    const sections = await fetchCategoryDashboardData(supabase, user.id, mediaCategories);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
      },
      stats,
      continueData,
      mediaCategories,
      sections,
    });
  } catch (error) {
    console.error('Public dashboard fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
