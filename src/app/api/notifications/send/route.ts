import { z } from 'zod';

import { fail, ok } from '@/lib/api/response';
import { ForbiddenError, requireAdminRole } from '@/lib/api/permissions';
import { UnauthorizedError } from '@/lib/api/auth';
import { API_ERRORS } from '@/lib/api/errors';
import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

const sendSchema = z.object({
  notificationId: z.string().min(1).max(255),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(240),
  url: z.string().min(1).max(512),
  userId: z.string().uuid().optional(),
  icon: z.string().max(512).optional(),
  badge: z.string().max(512).optional(),
});

function getEdgeFunctionUrl() {
  const explicitUrl = process.env.PUSH_EDGE_FUNCTION_URL;
  if (explicitUrl) {
    return explicitUrl;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    return null;
  }

  return `${baseUrl}/functions/v1/send-push-notification`;
}

const handler = withApiRoute(async request => {
  if (request.method !== 'POST') {
    return fail({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405, {
      headers: { Allow: 'POST' },
    });
  }

  try {
    const supabase = await createRouteHandlerClient();
    await requireAdminRole(supabase);

    const body = await request.json().catch(() => null);
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) {
      return fail({ error: 'Invalid send payload', code: API_ERRORS.BAD_REQUEST.code }, 400);
    }

    const functionUrl = getEdgeFunctionUrl();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!functionUrl || !serviceRoleKey) {
      return fail(
        {
          error:
            'Missing PUSH_EDGE_FUNCTION_URL (or NEXT_PUBLIC_SUPABASE_URL) / SUPABASE_SERVICE_ROLE_KEY',
          code: 'MISSING_PUSH_ENV',
        },
        500,
      );
    }

    const admin = createSupabaseAdminClient();

    const baseQuery = admin.from('push_subscriptions').select('user_id, endpoint, subscription');
    const result = parsed.data.userId
      ? await baseQuery.eq('user_id', parsed.data.userId)
      : await baseQuery;
    if (result.error) {
      return fail(
        {
          error: result.error.message || 'Failed to fetch subscriptions',
          code: 'SUBS_FETCH_FAILED',
        },
        500,
      );
    }

    const subscriptions = result.data ?? [];
    if (subscriptions.length === 0) {
      return ok({ sent: 0, failed: 0, total: 0 });
    }

    const sendResults = await Promise.allSettled(
      subscriptions.map(async subscription => {
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            subscription: subscription.subscription,
            notification: {
              notificationId: parsed.data.notificationId,
              title: parsed.data.title,
              body: parsed.data.body,
              url: parsed.data.url,
              icon: parsed.data.icon,
              badge: parsed.data.badge,
            },
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error || `Edge function failed with ${response.status}`);
        }
      }),
    );

    const sent = sendResults.filter(resultItem => resultItem.status === 'fulfilled').length;
    const failed = sendResults.length - sent;

    return ok({
      sent,
      failed,
      total: sendResults.length,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }

    if (error instanceof ForbiddenError) {
      return fail({ error: error.message, code: error.code }, 403);
    }

    throw error;
  }
});

export const POST = handler;
