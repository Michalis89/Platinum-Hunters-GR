import { z } from 'zod';

import { fail, ok } from '@/lib/api/response';
import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

const eventSchema = z.object({
  notificationId: z.string().min(1).max(255),
  action: z.enum(['received', 'open', 'dismiss']),
  route: z.string().max(512).optional(),
  platform: z.string().max(128).optional(),
});

const handler = withApiRoute(async request => {
  if (request.method !== 'POST') {
    return fail({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405, {
      headers: { Allow: 'POST' },
    });
  }

  const body = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ error: 'Invalid notification event payload', code: 'BAD_REQUEST' }, 400);
  }

  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return ok({ tracked: false });
  }

  const admin = createSupabaseAdminClient();

  const { error } = await admin.from('push_notification_events').insert({
    user_id: session.user.id,
    notification_id: parsed.data.notificationId,
    action: parsed.data.action,
    route: parsed.data.route ?? null,
    platform: parsed.data.platform ?? null,
  });

  if (error) {
    return fail({ error: error.message || 'Failed to track notification event', code: 'TRACK_FAILED' }, 500);
  }

  return ok({ tracked: true });
});

export const POST = handler;
