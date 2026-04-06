import { z } from 'zod';

import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const subscribeSchema = z.object({
  subscription: pushSubscriptionSchema,
  userAgent: z.string().max(1024).optional(),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

const handler = withApiRoute(async request => {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const userId = session.user.id;

    if (request.method === 'POST') {
      const body = await request.json().catch(() => null);
      const parsed = subscribeSchema.safeParse(body);
      if (!parsed.success) {
        return fail(
          { error: 'Invalid push subscription payload', code: API_ERRORS.BAD_REQUEST.code },
          API_ERRORS.BAD_REQUEST.status,
        );
      }

      const admin = createSupabaseAdminClient();

      const { error } = await admin.from('push_subscriptions').upsert(
        {
          user_id: userId,
          endpoint: parsed.data.subscription.endpoint,
          subscription: parsed.data.subscription,
          user_agent: parsed.data.userAgent ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,endpoint' },
      );

      if (error) {
        return fail(
          {
            error: error.message || 'Failed to store push subscription',
            code: 'PUSH_SUBSCRIBE_FAILED',
          },
          500,
        );
      }

      return ok({ subscribed: true });
    }

    if (request.method === 'DELETE') {
      const body = await request.json().catch(() => null);
      const parsed = unsubscribeSchema.safeParse(body);
      if (!parsed.success) {
        return fail(
          { error: 'Invalid unsubscribe payload', code: API_ERRORS.BAD_REQUEST.code },
          API_ERRORS.BAD_REQUEST.status,
        );
      }

      const admin = createSupabaseAdminClient();

      const { error } = await admin
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', parsed.data.endpoint);

      if (error) {
        return fail(
          {
            error: error.message || 'Failed to remove push subscription',
            code: 'PUSH_UNSUBSCRIBE_FAILED',
          },
          500,
        );
      }

      return ok({ subscribed: false });
    }

    return fail({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405, {
      headers: { Allow: 'POST, DELETE' },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    throw error;
  }
});

export const POST = handler;
export const DELETE = handler;
