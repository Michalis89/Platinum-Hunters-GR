import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import { getUserSettings, updateUserSettings } from '@/lib/settings';
import { z } from 'zod';

const settingsSchema = z.object({
  theme: z.enum(['system', 'dark', 'light']).optional(),
  social_enabled: z.boolean().optional(),
  community_activity_enabled: z.boolean().optional(),
  community_suggestions_enabled: z.boolean().optional(),
  articles_enabled: z.boolean().optional(),
  reviews_enabled: z.boolean().optional(),
});

const handler = withApiRoute(async (request: Request) => {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const userId = session.user.id;

    if (request.method === 'GET') {
      const settings = await getUserSettings(userId, { supabase });
      return ok(settings);
    }

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

      const parsed = settingsSchema.safeParse(body);
      if (!parsed.success) {
        return fail(
          { error: 'Invalid settings payload', code: API_ERRORS.BAD_REQUEST.code },
          API_ERRORS.BAD_REQUEST.status,
        );
      }

      const updated = await updateUserSettings(userId, parsed.data, { supabase });
      return ok(updated);
    }

    return fail(
      { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
      405,
      { headers: { Allow: 'GET, PATCH' } },
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    throw error;
  }
});

export const GET = handler;
export const PATCH = handler;
