import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import type { User } from '@/types/user';
import type { Json } from '@/lib/supabase/database.types';
import type { CategoryProfiles } from '@/lib/validation/profile';
import { enrichCategoryProfilesWithInsights } from '@/lib/profile/insight-genres';

/**
 * GET /api/me
 * Fetch current authenticated user's profile from new structure
 * - location_city: users.location_city (dedicated column)
 * - category_profile: user_category_profiles.profiles (dedicated table)
 */
const handler = withApiRoute(async (request: Request) => {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const userId = session.user.id;

    if (request.method === 'GET') {
      // Fetch user profile
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        return fail({ error: 'Failed to fetch user profile' }, 500);
      }

      // Fetch category profile from dedicated table
      const { data: categoryProfile } = await supabase
        .from('user_category_profiles')
        .select('profiles, created_at, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      let categoryProfileValue = (categoryProfile?.profiles as CategoryProfiles | null) || null;
      if (categoryProfileValue) {
        const enrichedProfiles = await enrichCategoryProfilesWithInsights(
          supabase,
          userId,
          categoryProfileValue,
        );
        const oldSerialized = JSON.stringify(categoryProfileValue);
        const newSerialized = JSON.stringify(enrichedProfiles);
        if (oldSerialized !== newSerialized) {
          const { error: syncError } = await supabase.from('user_category_profiles').upsert(
            {
              user_id: userId,
              profiles: enrichedProfiles as unknown as Json,
            },
            { onConflict: 'user_id' },
          );
          if (!syncError) {
            categoryProfileValue = enrichedProfiles;
          }
        } else {
          categoryProfileValue = enrichedProfiles;
        }
      }

      // Return user with category_profile from new table
      const response = {
        ...user,
        category_profile: categoryProfileValue,
      };

      return ok(response as User & { category_profile: unknown });
    }

    return fail({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405, {
      headers: { Allow: 'GET' },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    throw error;
  }
});

export const GET = handler;
