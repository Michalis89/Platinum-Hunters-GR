import { withApiRoute } from '@/lib/observability/withApiRoute';

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import getSupabaseServer from '@/lib/supabase-server';
import { API_ERRORS } from '@/lib/api/errors';
import { ok, fail } from '@/lib/api/response';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';

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

async function POSTHandler(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const formData = await req.formData();

    const { id: ticketId } = await context.params;
    const messageText = String(formData.get('message') ?? '').trim();

    if (!messageText) {
      return fail({ error: 'Το μήνυμα είναι υποχρεωτικό.' }, 400);
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, status, user_id')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return fail(API_ERRORS.NOT_FOUND, API_ERRORS.NOT_FOUND.status);
    }

    if (ticket.user_id !== session.user.id) {
      return fail(API_ERRORS.FORBIDDEN, API_ERRORS.FORBIDDEN.status);
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
        author_role: 'user',
        message: messageText,
        is_internal: false,
      })
      .select('*')
      .single();

    if (messageError || !message) {
      console.error('Support message insert error:', messageError);
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
          console.error('Support attachment upload failed:', uploadError);
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
          console.error('Support attachment insert failed:', attachmentError);
          await adminClient.storage.from('support-attachments').remove([storagePath]);
          return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
        }
      }
    }

    if (ticket.status === 'waiting_user' || ticket.status === 'open') {
      const adminClient = getSupabaseServer();
      await adminClient
        .from('support_tickets')
        .update({ status: 'in_progress' })
        .eq('id', ticketId);
    }

    return ok({ message_id: message.id }, { status: 201 });
  } catch (error) {
    console.error('Support ticket reply error:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const POST = withApiRoute(POSTHandler);
