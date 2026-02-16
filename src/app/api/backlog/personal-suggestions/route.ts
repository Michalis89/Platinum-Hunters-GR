import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { API_ERRORS } from '@/lib/api/errors';
import { fail } from '@/lib/api/response';
import {
  buildBacklogPersonalMediaSuggestions,
  type DashboardCategoryKey,
} from '@/lib/dashboard/category-data';
import { DEFAULT_COVER } from '@/lib/constants/messages';

const ALLOWED_CATEGORIES: DashboardCategoryKey[] = [
  'games',
  'anime',
  'manga',
  'movies',
  'tv',
  'books',
];

function isDashboardCategory(value: string): value is DashboardCategoryKey {
  return ALLOWED_CATEGORIES.includes(value as DashboardCategoryKey);
}

async function GETHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawCategory = (searchParams.get('category') || 'games').toLowerCase();
    const category: DashboardCategoryKey = isDashboardCategory(rawCategory) ? rawCategory : 'games';

    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);

    const suggestions = await buildBacklogPersonalMediaSuggestions(
      supabase,
      session.user.id,
      category,
      4,
    );

    const items = suggestions.slice(0, 4).map(item => ({
      source: 'local' as const,
      id: `personal-${category}-${item.mediaId}`,
      mediaId: item.mediaId,
      title: item.title,
      subtitle: item.reason,
      status: 'planned' as const,
      score: (item.confidence * 10).toFixed(1),
      tags: item.genres ?? item.tags ?? [],
      cover: item.cover || DEFAULT_COVER,
      description: item.reason,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    console.error('Backlog personal suggestions error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const GET = withApiRoute(GETHandler);
