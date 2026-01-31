import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { API_ERRORS } from '@/lib/api/errors';
import { ok, fail } from '@/lib/api/response';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createRouteHandlerClient();
    await requireAuth(supabase);

    const { id: ticketId } = await context.params;

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return fail(API_ERRORS.NOT_FOUND, API_ERRORS.NOT_FOUND.status);
    }

    const { data: messages, error: messagesError } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Support messages fetch error:', messagesError);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    const { data: attachments, error: attachmentsError } = await supabase
      .from('support_attachments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (attachmentsError) {
      console.error('Support attachments fetch error:', attachmentsError);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    const attachmentsWithUrls = await Promise.all(
      (attachments ?? []).map(async attachment => {
        const { data: signedData } = await supabase.storage
          .from('support-attachments')
          .createSignedUrl(attachment.storage_path, 60 * 60);

        return {
          ...attachment,
          signed_url: signedData?.signedUrl ?? null,
        };
      }),
    );

    return ok({
      ticket,
      messages: messages ?? [],
      attachments: attachmentsWithUrls,
    });
  } catch (error) {
    console.error('Support ticket detail error:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createRouteHandlerClient();
    await requireAuth(supabase);
    const { id: ticketId } = await context.params;
    const body = await req.json();
    const action = body?.action as 'archive' | 'unarchive' | 'delete';

    let archived: boolean | null = null;
    let deleted: boolean | null = null;

    if (action === 'archive') archived = true;
    if (action === 'unarchive') archived = false;
    if (action === 'delete') deleted = true;

    if (archived === null && deleted === null) {
      return fail({ error: 'Μη έγκυρη ενέργεια.' }, 400);
    }

    const { data, error } = await supabase.rpc('user_set_support_ticket_flags', {
      p_ticket_id: ticketId,
      p_archived: archived,
      p_deleted: deleted,
    });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('NOT_FOUND_OR_FORBIDDEN')) {
        return fail(API_ERRORS.FORBIDDEN, API_ERRORS.FORBIDDEN.status);
      }
      console.error('Ticket archive/delete error:', error);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    return ok({ ticket: data });
  } catch (error) {
    console.error('Support ticket update flags error:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}
