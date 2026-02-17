import { withApiRoute } from '@/lib/observability/withApiRoute';

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { API_ERRORS } from '@/lib/api/errors';
import { ok, fail } from '@/lib/api/response';

type CategoryStats = {
  total: number;
  in_progress: number;
  completed: number;
  dropped: number;
  hours: number;
};

export type PersonalStats = {
  // Summary totals
  total_backlog: number;
  in_progress: number;
  completed: number;
  total_hours: number;
  // Per-category breakdown
  games: CategoryStats;
  anime: CategoryStats;
  manga: CategoryStats & { chapters: number };
  movies: CategoryStats;
  tv: CategoryStats;
  books: CategoryStats & { pages: number };
  // Which categories user has content in
  active_categories: string[];
};

export const revalidate = 300;

const EMPTY_STATS: PersonalStats = {
  total_backlog: 0,
  in_progress: 0,
  completed: 0,
  total_hours: 0,
  games: { total: 0, in_progress: 0, completed: 0, dropped: 0, hours: 0 },
  anime: { total: 0, in_progress: 0, completed: 0, dropped: 0, hours: 0 },
  manga: { total: 0, in_progress: 0, completed: 0, dropped: 0, hours: 0, chapters: 0 },
  movies: { total: 0, in_progress: 0, completed: 0, dropped: 0, hours: 0 },
  tv: { total: 0, in_progress: 0, completed: 0, dropped: 0, hours: 0 },
  books: { total: 0, in_progress: 0, completed: 0, dropped: 0, hours: 0, pages: 0 },
  active_categories: [],
};

async function GETHandler() {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const userId = session.user.id;

    const { data, error } = await supabase.rpc('calculate_user_stats', {
      p_user_id: userId,
    });

    if (error) {
      throw error;
    }

    return ok((data as PersonalStats) ?? EMPTY_STATS);
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === API_ERRORS.UNAUTHORIZED.code)
    ) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    console.error('User stats error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const GET = withApiRoute(GETHandler);
