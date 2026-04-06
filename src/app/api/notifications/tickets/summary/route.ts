import { withApiRoute } from '@/lib/observability/withApiRoute';

import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getUserSettings } from '@/lib/settings';
import { hasAnyRole } from '@/lib/roles';

async function GETHandler() {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const settings = await getUserSettings(session.user.id, { supabase });

    if (!settings.ticket_notifications_enabled) {
      return ok({
        unread_count: 0,
        user_unread_count: 0,
        admin_unread_count: 0,
        enabled: false,
      });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('roles')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('Ticket notifications summary user roles error:', userError);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    const canAccessAdminQueue = hasAnyRole(userData, ['admin', 'owner', 'moderator']);
    let adminUnreadCount = 0;

    if (canAccessAdminQueue) {
      const { data: adminCountData, error: adminCountError } =
        await supabase.rpc('get_ticket_unread_count');

      if (adminCountError) {
        console.error('Ticket notifications summary admin unread error:', adminCountError);
        return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
      }

      adminUnreadCount = Number(adminCountData ?? 0);
    }

    const { data: ownTickets, error: ownTicketsError } = await supabase
      .from('support_tickets')
      .select('id, created_at')
      .eq('user_id', session.user.id)
      .eq('user_deleted', false);

    if (ownTicketsError) {
      console.error('Ticket notifications summary own tickets error:', ownTicketsError);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    const ownTicketIds = (ownTickets ?? []).map(ticket => ticket.id);
    let userUnreadCount = 0;

    if (ownTicketIds.length > 0) {
      const { data: reads, error: readsError } = await supabase
        .from('support_ticket_reads')
        .select('ticket_id, last_read_at')
        .eq('user_id', session.user.id)
        .in('ticket_id', ownTicketIds);

      if (readsError) {
        console.error('Ticket notifications summary reads error:', readsError);
        return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
      }

      const { data: adminMessages, error: adminMessagesError } = await supabase
        .from('support_messages')
        .select('ticket_id, created_at')
        .in('ticket_id', ownTicketIds)
        .eq('author_role', 'admin')
        .eq('is_internal', false);

      if (adminMessagesError) {
        console.error('Ticket notifications summary admin messages error:', adminMessagesError);
        return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
      }

      const readAtByTicket = new Map<string, string>();
      for (const entry of reads ?? []) {
        if (entry.last_read_at) {
          readAtByTicket.set(entry.ticket_id, entry.last_read_at);
        }
      }

      const ticketCreatedAt = new Map<string, string | null>();
      for (const ticket of ownTickets ?? []) {
        ticketCreatedAt.set(ticket.id, ticket.created_at ?? null);
      }

      for (const message of adminMessages ?? []) {
        const readAt = readAtByTicket.get(message.ticket_id);
        const fallbackAt = ticketCreatedAt.get(message.ticket_id);
        const baseline = readAt ?? fallbackAt;
        const isUnread =
          !baseline ||
          (message.created_at ? new Date(message.created_at) > new Date(baseline) : false);

        if (isUnread) {
          userUnreadCount += 1;
        }
      }
    }

    const totalUnreadCount = userUnreadCount + adminUnreadCount;

    return ok({
      unread_count: totalUnreadCount,
      user_unread_count: userUnreadCount,
      admin_unread_count: adminUnreadCount,
      enabled: true,
    });
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
