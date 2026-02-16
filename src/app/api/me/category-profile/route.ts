import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import {
  categoryProfilePatchSchema,
  mergeCategoryProfiles,
  type CategoryProfiles,
} from '@/lib/validation/profile';

const handler = withApiRoute(async (request: Request) => {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const userId = session.user.id;

    if (request.method === 'GET') {
      // Fetch category profile
      const { data: categoryProfile, error } = await supabase
        .from('user_category_profiles')
        .select('profiles, created_at, updated_at')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found (acceptable)
        return fail({ error: 'Failed to fetch category profile' }, 500);
      }

      // Fallback: If no row exists, check social_links.category_notes
      if (!categoryProfile) {
        const { data: user } = await supabase
          .from('users')
          .select('social_links')
          .eq('id', userId)
          .single();

        const socialLinks = (user?.social_links as Record<string, unknown>) || {};
        const legacyCategoryNotes = (socialLinks.category_notes as CategoryProfiles) || {};

        return ok({
          profiles: legacyCategoryNotes,
          created_at: null,
          updated_at: null,
          _source: 'legacy_social_links',
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

      // Validate patch
      const parsed = categoryProfilePatchSchema.safeParse(body);
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

      // Fetch existing profile
      const { data: existing } = await supabase
        .from('user_category_profiles')
        .select('profiles')
        .eq('user_id', userId)
        .single();

      // Merge patch into existing profiles
      const existingProfiles = (existing?.profiles as CategoryProfiles) || {};
      const mergedProfiles = mergeCategoryProfiles(existingProfiles, parsed.data);

      // Upsert
      const { data: updated, error: upsertError } = await supabase
        .from('user_category_profiles')
        .upsert(
          {
            user_id: userId,
            profiles: mergedProfiles,
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
