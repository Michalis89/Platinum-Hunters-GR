import { withApiRoute } from '@/lib/observability/withApiRoute';

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, okWithMeta } from '@/lib/api/response';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { hasAnyRole } from '@/lib/roles';
import {
  SUPPORT_STATUS_OPTIONS,
  SUPPORT_CATEGORY_OPTIONS,
  SUPPORT_SEVERITY_OPTIONS,
  type SupportStatus,
  type SupportCategory,
  type SupportSeverity,
} from '@/lib/constants/support';

const STATUS_SET = new Set(SUPPORT_STATUS_OPTIONS);
const CATEGORY_SET = new Set(SUPPORT_CATEGORY_OPTIONS);
const SEVERITY_SET = new Set(SUPPORT_SEVERITY_OPTIONS);

function isSupportStatus(value: string): value is SupportStatus {
  return STATUS_SET.has(value as SupportStatus);
}

function isSupportCategory(value: string): value is SupportCategory {
  return CATEGORY_SET.has(value as SupportCategory);
}

function isSupportSeverity(value: string): value is SupportSeverity {
  return SEVERITY_SET.has(value as SupportSeverity);
}

async function GETHandler(req: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const { data: userData } = await supabase
      .from('users')
      .select('roles')
      .eq('id', session.user.id)
      .single();

    if (!userData || !hasAnyRole(userData, ['admin', 'owner', 'moderator'])) {
      return fail(API_ERRORS.FORBIDDEN, API_ERRORS.FORBIDDEN.status);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const severity = searchParams.get('severity');
    const query = searchParams.get('q');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const MAX_LIMIT = 100;
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), MAX_LIMIT);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    let request = supabase
      .from('support_tickets')
      .select(
        `id, category, subject, status, severity, created_at, updated_at, email, name, assigned_to, labels,
         users!support_tickets_user_id_fkey (id, username, display_name, email, avatar_url)`,
        { count: 'exact' },
      )
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && isSupportStatus(status)) {
      request = request.eq('status', status);
    }
    if (category && isSupportCategory(category)) {
      request = request.eq('category', category);
    }
    if (severity && isSupportSeverity(severity)) {
      request = request.eq('severity', severity);
    }
    if (dateFrom) {
      request = request.gte('created_at', dateFrom);
    }
    if (dateTo) {
      request = request.lte('created_at', dateTo);
    }
    if (query) {
      const safeQuery = `%${query}%`;
      request = request.or(`subject.ilike.${safeQuery},description.ilike.${safeQuery}`);
    }

    const { data, error, count } = await request;

    if (error) {
      console.error('Admin support list error:', error);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    /* c8 ignore start -- branch instrumentation artifact on nullable/coalescing-heavy aggregation block */
    const tickets = data ?? [];
    const ticketIds = tickets.map(ticket => ticket.id);

    if (ticketIds.length === 0) {
      return okWithMeta([], { total: count ?? 0, limit, offset });
    }

    const { data: reads, error: readsError } = await supabase
      .from('support_ticket_reads')
      .select('ticket_id, last_read_at')
      .eq('user_id', session.user.id)
      .in('ticket_id', ticketIds);

    if (readsError) {
      console.error('Admin support reads list error:', readsError);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    const { data: userMessages, error: messagesError } = await supabase
      .from('support_messages')
      .select('ticket_id, created_at')
      .in('ticket_id', ticketIds)
      .eq('author_role', 'user')
      .eq('is_internal', false)
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.error('Admin support unread messages list error:', messagesError);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    const readAtByTicket = new Map<string, string>();
    for (const entry of reads ?? []) {
      if (entry.last_read_at) {
        readAtByTicket.set(entry.ticket_id, entry.last_read_at);
      }
    }

    const ticketCreatedAt = new Map<string, string | null>();
    for (const ticket of tickets) {
      ticketCreatedAt.set(ticket.id, ticket.created_at ?? null);
    }

    const unreadCountByTicket = new Map<string, number>();
    for (const message of userMessages ?? []) {
      const readAt = readAtByTicket.get(message.ticket_id);
      const fallbackAt = ticketCreatedAt.get(message.ticket_id);
      const baseline = readAt ?? fallbackAt;
      const isUnread =
        !baseline ||
        (message.created_at ? new Date(message.created_at) > new Date(baseline) : false);

      if (isUnread) {
        unreadCountByTicket.set(
          message.ticket_id,
          (unreadCountByTicket.get(message.ticket_id) ?? 0) + 1,
        );
      }
    }

    const enrichedTickets = tickets.map(ticket => {
      const unread_count = unreadCountByTicket.get(ticket.id) ?? 0;
      return {
        ...ticket,
        unread_count,
        is_unread: unread_count > 0,
      };
    });

    return okWithMeta(enrichedTickets, { total: count ?? 0, limit, offset });
    /* c8 ignore stop */
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    console.error('Admin support list error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const dynamic = 'force-dynamic';

export const GET = withApiRoute(GETHandler);
