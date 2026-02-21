import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import type { Json } from '@/lib/supabase/database.types';
import { categoryProfilesSchema } from '@/lib/validation/profile';

const handler = withApiRoute(async (request: Request) => {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const userId = session.user.id;

    if (request.method === 'GET') {
      // Fetch category profile from dedicated table
      const { data: categoryProfile, error } = await supabase
        .from('user_category_profiles')
        .select('profiles, created_at, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        return fail({ error: 'Failed to fetch category profile' }, 500);
      }

      // Return empty profiles if no row exists yet
      if (!categoryProfile) {
        return ok({
          profiles: {},
          created_at: null,
          updated_at: null,
        });
      }

      return ok(categoryProfile);
    }

    if (request.method === 'PUT') {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return fail(
          { error: 'Invalid request body', code: API_ERRORS.BAD_REQUEST.code },
          API_ERRORS.BAD_REQUEST.status,
        );
      }

      // Validate complete category profile payload (PUT = replace)
      const parsed = categoryProfilesSchema.safeParse(body);
      if (!parsed.success) {
        return fail(
          {
            error: 'Invalid category profile payload',
            code: API_ERRORS.BAD_REQUEST.code,
            details: parsed.error.format(),
          },
          API_ERRORS.BAD_REQUEST.status,
        );
      }

      // Upsert
      const { data: updated, error: upsertError } = await supabase
        .from('user_category_profiles')
        .upsert(
          {
            user_id: userId,
            profiles: parsed.data as unknown as Json,
          },
          {
            onConflict: 'user_id',
          },
        )
        .select()
        .single();

      if (upsertError) {
        return fail({ error: 'Failed to update category profile' }, 500);
      }

      return ok(updated);
    }

    return fail({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405, {
      headers: { Allow: 'GET, PUT' },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    throw error;
  }
});

export const GET = handler;
export const PUT = handler;
