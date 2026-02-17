import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import { refreshGenreAffinity, fetchGenreAffinityMap } from '@/lib/profile/genre-affinity';

const handler = withApiRoute(async (request: Request) => {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const userId = session.user.id;

    if (request.method === 'GET') {
      const { data, error } = await supabase
        .from('user_genre_affinity')
        .select('category,genre,score,item_count,strong_signal_count,updated_at')
        .eq('user_id', userId)
        .order('score', { ascending: false });

      if (error) {
        return fail({ error: 'Failed to fetch genre affinity' }, 500);
      }

      return ok(data ?? []);
    }

    if (request.method === 'POST') {
      // Recompute and store genre affinity
      await refreshGenreAffinity(supabase, userId);

      // Return the freshly computed affinity map
      const affinity = await fetchGenreAffinityMap(supabase, userId);

      return ok({ affinity, message: 'Genre affinity recomputed successfully' });
    }

    return fail({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405, {
      headers: { Allow: 'GET, POST' },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    throw error;
  }
});

export const GET = handler;
export const POST = handler;
