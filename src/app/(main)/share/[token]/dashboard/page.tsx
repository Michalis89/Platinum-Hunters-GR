import type { Metadata } from 'next';
import getSupabaseServer from '@/lib/supabase-server';
import { fetchUserStats, fetchContinueData } from '@/lib/dashboard/server-data';
import {
  DASHBOARD_TAB_CATEGORIES,
  fetchCategoryDashboardData,
  type DashboardCategoryKey,
} from '@/lib/dashboard/category-data';
import { HomeDashboardSections } from '@/app/components/home/HomeDashboardSections';

export const dynamic = 'force-dynamic';

const isTokenExpired = (expiresAt: string | null | undefined) =>
  Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const supabase = getSupabaseServer();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tokenRow } = await ((supabase as any)
    .from('share_tokens')
    .select('user_id,expires_at')
    .eq('token', token)
    .maybeSingle() as Promise<{ data: { user_id: string; expires_at: string | null } | null }>);

  if (!tokenRow || isTokenExpired(tokenRow.expires_at)) {
    return { title: 'Invalid Share Link | Hobbistas' };
  }

  const { data: user } = await supabase
    .from('users')
    .select('username')
    .eq('id', tokenRow.user_id)
    .maybeSingle();

  return {
    title: user ? `${user.username}'s Dashboard | Hobbistas` : 'Shared Dashboard | Hobbistas',
    description: 'Read-only dashboard shared via invite link.',
    robots: { index: false },
  };
}

function InvalidLink({ message }: { message: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-2xl font-semibold text-foreground">Invalid Share Link</p>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

type ShareDashboardLoadResult =
  | { kind: 'invalid'; message: string }
  | {
      kind: 'ok';
      displayName: string;
      mediaCategories: DashboardCategoryKey[];
      sections: Awaited<ReturnType<typeof fetchCategoryDashboardData>>;
      stats: Awaited<ReturnType<typeof fetchUserStats>>;
    };

async function loadShareDashboardData(
  token: string,
  supabase: ReturnType<typeof getSupabaseServer>,
): Promise<ShareDashboardLoadResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tokenRow, error: tokenError } = await ((supabase as any)
      .from('share_tokens')
      .select('user_id,expires_at')
      .eq('token', token)
      .maybeSingle() as Promise<{
      data: { user_id: string; expires_at: string | null } | null;
      error: { message?: string } | null;
    }>);

    if (tokenError) {
      console.error('[share/token/dashboard] DB error:', tokenError);
      return { kind: 'invalid', message: 'Could not verify this share link. Please try again later.' };
    }

    if (!tokenRow || isTokenExpired(tokenRow.expires_at)) {
      return { kind: 'invalid', message: 'This share link is invalid or has been revoked.' };
    }

    const { data: user } = await supabase
      .from('users')
      .select('id,username,display_name')
      .eq('id', tokenRow.user_id)
      .maybeSingle();

    if (!user) {
      return { kind: 'invalid', message: 'The owner of this link could not be found.' };
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
    const displayName = user.display_name ?? user.username;

    return { kind: 'ok', displayName, mediaCategories, sections, stats };
  } catch (error) {
    console.error('[share/token/dashboard] Unexpected error:', error);
    return { kind: 'invalid', message: 'Something went wrong. Please try again later.' };
  }
}

export default async function ShareDashboardPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = getSupabaseServer();
  const result = await loadShareDashboardData(token, supabase);

  if (result.kind === 'invalid') {
    return <InvalidLink message={result.message} />;
  }

  return (
    <div className="w-full px-2 pb-10 pt-2 md:px-4 md:pb-14 md:pt-4">
      <section className="px-4 pb-8 pt-12 md:px-6 md:pb-10 md:pt-16">
        <div className="mx-auto max-w-screen-2xl space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Shared dashboard</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {result.displayName}&apos;s Dashboard
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            Read-only insights, favorites, and recommendations.
          </p>
        </div>
      </section>

      <HomeDashboardSections
        mediaCategories={result.mediaCategories}
        categorySections={result.sections}
        stats={result.stats}
        isReadOnly
      />
    </div>
  );
}
