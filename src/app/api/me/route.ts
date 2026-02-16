import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import type { User } from '@/types/user';

/**
 * GET /api/me
 * Fetch current authenticated user's profile with new fields
 * Includes backward-compatible fallback for location_city and category_profile
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

      // Fetch category profile
      const { data: categoryProfile } = await supabase
        .from('user_category_profiles')
        .select('profiles, created_at, updated_at')
        .eq('user_id', userId)
        .single();

      // Parse social_links for backward compatibility
      const socialLinks = (user.social_links as Record<string, unknown>) || {};

      // Merge response with backward-compatible fallbacks
      const response = {
        ...user,
        // Prefer new location_city column, fallback to social_links.location_city
        location_city: user.location_city || (socialLinks.location_city as string | undefined) || null,
        // Add category_profile (preferred source)
        category_profile: categoryProfile?.profiles || null,
        // Keep social_links as-is for now (for backward compatibility)
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
