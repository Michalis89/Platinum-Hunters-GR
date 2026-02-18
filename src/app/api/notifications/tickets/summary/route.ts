import { withApiRoute } from '@/lib/observability/withApiRoute';

import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getUserSettings } from '@/lib/settings';

async function GETHandler() {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const settings = await getUserSettings(session.user.id, { supabase });

    if (!settings.ticket_notifications_enabled) {
      return ok({ unread_count: 0, enabled: false });
    }

    const { data, error } = await supabase.rpc('get_ticket_unread_count');

    if (error) {
      console.error('Ticket notifications summary error:', error);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    return ok({ unread_count: Number(data ?? 0), enabled: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }

    console.error('Ticket notifications summary error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const dynamic = 'force-dynamic';
export const GET = withApiRoute(GETHandler);
