import { withApiRoute } from '@/lib/observability/withApiRoute';

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import getSupabaseServer from '@/lib/supabase-server';
import { API_ERRORS } from '@/lib/api/errors';
import { ok, fail } from '@/lib/api/response';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { hasAnyRole } from '@/lib/roles';

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

const sanitizeFilename = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 80);

const coerceBoolean = (value: FormDataEntryValue | null) => {
  if (value === null) return false;
  if (typeof value === 'string') {
    return value === 'true' || value === 'on' || value === '1';
  }
  return false;
};

const getFiles = (formData: FormData) => {
  const entries = formData.getAll('attachments');
  return entries.filter(item => item instanceof File) as File[];
};

const validateAttachments = (files: File[]) => {
  if (files.length > MAX_ATTACHMENTS) {
    return `Μπορείς να ανεβάσεις μέχρι ${MAX_ATTACHMENTS} αρχεία.`;
  }
  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return 'Επιτρέπονται μόνο PNG, JPG, WEBP ή PDF αρχεία.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Κάθε αρχείο πρέπει να είναι μέχρι 5MB.';
    }
  }
  return null;
};

async function ensureAdmin(supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>) {
  const session = await requireAuth(supabase);
  const { data: userData } = await supabase
    .from('users')
    .select('role, roles')
    .eq('id', session.user.id)
    .single();

  if (!userData || !hasAnyRole(userData, ['admin', 'owner', 'moderator'])) {
    throw new Error('FORBIDDEN');
  }

  return session;
}

async function POSTHandler(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await ensureAdmin(supabase);
    const formData = await req.formData();

    const { id: ticketId } = await context.params;
    const messageText = String(formData.get('message') ?? '').trim();
    const isInternal = coerceBoolean(formData.get('is_internal'));

    if (!messageText) {
      return fail({ error: 'Το μήνυμα είναι υποχρεωτικό.' }, 400);
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, status')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return fail(API_ERRORS.NOT_FOUND, API_ERRORS.NOT_FOUND.status);
    }

    const files = getFiles(formData);
    const attachmentsError = validateAttachments(files);
    if (attachmentsError) {
      return fail({ error: attachmentsError }, 400);
    }

    const { data: message, error: messageError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        author_user_id: session.user.id,
        author_role: 'admin',
        message: messageText,
        is_internal: isInternal,
      })
      .select('*')
      .single();

    if (messageError || !message) {
      console.error('Admin support reply insert error:', messageError);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    if (files.length > 0) {
      const adminClient = getSupabaseServer();
      for (const file of files) {
        const ext = file.name.split('.').pop() || 'file';
        const safeName = sanitizeFilename(file.name) || `attachment.${ext}`;
        const storagePath = `support/${ticketId}/${message.id}/${Date.now()}-${safeName}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadError } = await adminClient.storage
          .from('support-attachments')
          .upload(storagePath, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Admin support attachment upload failed:', uploadError);
          return fail({ error: 'Αποτυχία μεταφόρτωσης αρχείων.' }, 500);
        }

        const { error: attachmentError } = await supabase.from('support_attachments').insert({
          ticket_id: ticketId,
          message_id: message.id,
          uploader_user_id: session.user.id,
          file_name: file.name,
          storage_path: storagePath,
          mime_type: file.type,
          size_bytes: file.size,
        });

        if (attachmentError) {
          console.error('Admin support attachment insert failed:', attachmentError);
          await adminClient.storage.from('support-attachments').remove([storagePath]);
          return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
        }
      }
    }

    if (!isInternal && ticket.status !== 'waiting_user') {
      const { error: updateError } = await supabase
        .from('support_tickets')
        .update({ status: 'waiting_user' })
        .eq('id', ticketId);

      if (!updateError) {
        await supabase.from('support_ticket_events').insert({
          ticket_id: ticketId,
          type: 'status_change',
          payload: { from: ticket.status, to: 'waiting_user' },
          actor_user_id: session.user.id,
        });
      }
    }

    return ok({ message_id: message.id }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return fail(API_ERRORS.FORBIDDEN, API_ERRORS.FORBIDDEN.status);
    }
    console.error('Admin support reply error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const POST = withApiRoute(POSTHandler);
