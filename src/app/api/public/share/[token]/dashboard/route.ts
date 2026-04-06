import { NextResponse } from 'next/server';
import getSupabaseServer from '@/lib/supabase-server';
import { fetchUserStats, fetchContinueData } from '@/lib/dashboard/server-data';
import {
  DASHBOARD_TAB_CATEGORIES,
  fetchCategoryDashboardData,
  type DashboardCategoryKey,
} from '@/lib/dashboard/category-data';

const isTokenExpired = (expiresAt: string | null | undefined) =>
  Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const supabase = getSupabaseServer();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tokenRow } = await ((supabase as any)
      .from('share_tokens')
      .select('user_id,expires_at')
      .eq('token', token)
      .maybeSingle() as Promise<{
      data: { user_id: string; expires_at: string | null } | null;
    }>);

    if (!tokenRow || isTokenExpired(tokenRow.expires_at)) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('id,username,display_name')
      .eq('id', tokenRow.user_id)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
    console.error('Public share dashboard fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
