import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import { locationCitySchema } from '@/lib/validation/profile';

/**
 * PATCH /api/me/location
 * Update current user's location_city
 */
const handler = withApiRoute(async (request: Request) => {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const userId = session.user.id;

    if (request.method === 'PATCH') {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return fail(
          { error: 'Invalid request body', code: API_ERRORS.BAD_REQUEST.code },
          API_ERRORS.BAD_REQUEST.status,
        );
      }

      // Extract location_city from body
      const locationCity = (body as { location_city?: string }).location_city;

      // Validate
      const parsed = locationCitySchema.safeParse(locationCity);
      if (!parsed.success) {
        return fail(
          {
            error: 'Invalid location_city',
            code: API_ERRORS.BAD_REQUEST.code,
            details: parsed.error.format(),
          },
          API_ERRORS.BAD_REQUEST.status,
        );
      }

      // Update users.location_city
      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update({ location_city: parsed.data })
        .eq('id', userId)
        .select('location_city')
        .single();

      if (updateError) {
        return fail({ error: 'Failed to update location' }, 500);
      }

      return ok(updated);
    }

    return fail({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405, {
      headers: { Allow: 'PATCH' },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    throw error;
  }
});

export const PATCH = handler;
