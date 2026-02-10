import { withApiRoute } from '@/lib/observability/withApiRoute';

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import getSupabaseServer from '@/lib/supabase-server';
import type { Database, Json } from '@/lib/supabase/database.types';
import { API_ERRORS } from '@/lib/api/errors';
import { ok, fail } from '@/lib/api/response';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import {
  SUPPORT_CATEGORY_OPTIONS,
  SUPPORT_SEVERITY_OPTIONS,
  type SupportCategory,
  type SupportSeverity,
} from '@/lib/constants/support';

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

const CATEGORY_SET = new Set(SUPPORT_CATEGORY_OPTIONS);
const SEVERITY_SET = new Set(SUPPORT_SEVERITY_OPTIONS);
const URGENCY_SET = new Set(['nice_to_have', 'important', 'urgent']);

function isSupportCategory(value: string): value is SupportCategory {
  return CATEGORY_SET.has(value as SupportCategory);
}

function isSupportSeverity(value: string): value is SupportSeverity {
  return SEVERITY_SET.has(value as SupportSeverity);
}

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

const parseOptionalJson = (value: FormDataEntryValue | null) => {
  if (!value || typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
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

async function GETHandler() {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);

    const { data, error } = await supabase
      .from('support_tickets')
      .select(
        'id, category, subject, status, severity, created_at, updated_at, assigned_to, labels, user_archived, user_deleted',
      )
      .eq('user_id', session.user.id)
      .eq('user_deleted', false)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Support tickets fetch error:', error);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    return ok(data ?? []);
  } catch (error) {
    console.error('Support tickets list error:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

async function POSTHandler(req: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const formData = await req.formData();

    const category = String(formData.get('category') ?? '').trim();
    const subject = String(formData.get('subject') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const consent = coerceBoolean(formData.get('consent'));
    const allowFollowUp = coerceBoolean(formData.get('allow_follow_up'));

    if (!isSupportCategory(category)) {
      return fail({ error: 'Μη έγκυρη κατηγορία.' }, 400);
    }
    if (!subject || !description) {
      return fail({ error: 'Το θέμα και η περιγραφή είναι υποχρεωτικά.' }, 400);
    }
    if (!consent) {
      return fail({ error: 'Χρειάζεται να αποδεχθείς την αποθήκευση των στοιχείων.' }, 400);
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    let resolvedEmail = email || session?.user.email || '';
    let resolvedName = name;

    if (session) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('display_name, username, email')
        .eq('id', session.user.id)
        .single();

      resolvedEmail = resolvedEmail || userProfile?.email || '';
      resolvedName = resolvedName || userProfile?.display_name || userProfile?.username || '';
    }

    // Support tickets now require authentication
    if (!session) {
      return fail({ error: 'Πρέπει να συνδεθείς για να υποβάλεις αίτημα υποστήριξης.' }, 401);
    }

    if (!resolvedEmail) {
      return fail({ error: 'Το email είναι υποχρεωτικό.' }, 400);
    }

    const environment = parseOptionalJson(formData.get('environment'));

    const meta: Record<string, unknown> = {
      consent,
      allow_follow_up: allowFollowUp,
    };

    let severity: string | null = null;

    if (category === 'bug') {
      const steps = String(formData.get('steps_to_reproduce') ?? '').trim();
      const expected = String(formData.get('expected') ?? '').trim();
      const actual = String(formData.get('actual') ?? '').trim();
      const severityValue = String(formData.get('severity') ?? '').trim();

      if (!steps || !expected || !actual) {
        return fail({ error: 'Συμπλήρωσε βήματα, αναμενόμενο και πραγματικό αποτέλεσμα.' }, 400);
      }
      if (!isSupportSeverity(severityValue)) {
        return fail({ error: 'Επίλεξε επίπεδο σοβαρότητας.' }, 400);
      }

      severity = severityValue;
      meta.steps_to_reproduce = steps;
      meta.expected = expected;
      meta.actual = actual;
    }

    if (category === 'feature') {
      const useCase = String(formData.get('use_case') ?? '').trim();
      const value = String(formData.get('value') ?? '').trim();
      const urgency = String(formData.get('urgency') ?? '').trim();

      if (!useCase || !value) {
        return fail({ error: 'Συμπλήρωσε use case και αξία.' }, 400);
      }
      if (!URGENCY_SET.has(urgency)) {
        return fail({ error: 'Επίλεξε επίπεδο προτεραιότητας.' }, 400);
      }

      meta.use_case = useCase;
      meta.value = value;
      meta.urgency = urgency;
    }

    if (category === 'author_rights') {
      const profileLink = String(formData.get('profile_link') ?? '').trim();
      const portfolioLinks = String(formData.get('portfolio_links') ?? '').trim();
      const reason = String(formData.get('reason') ?? '').trim();
      const requestedPermissions = parseOptionalJson(formData.get('requested_permissions'));

      if (!reason) {
        return fail({ error: 'Πες μας τον λόγο του αιτήματός σου.' }, 400);
      }

      if (profileLink) meta.profile_link = profileLink;
      if (portfolioLinks) {
        meta.portfolio_links = portfolioLinks
          .split(',')
          .map(item => item.trim())
          .filter(Boolean);
      }
      meta.reason = reason;
      if (Array.isArray(requestedPermissions)) {
        meta.requested_permissions = requestedPermissions;
      }
    }

    if (category === 'general') {
      const topic = String(formData.get('topic') ?? '').trim();
      if (topic) meta.topic = topic;
    }

    const files = getFiles(formData);
    const attachmentsError = validateAttachments(files);
    if (attachmentsError) {
      return fail({ error: attachmentsError }, 400);
    }

    const insertPayload: Database['public']['Tables']['support_tickets']['Insert'] = {
      user_id: session.user.id,
      email: resolvedEmail || null,
      name: resolvedName || null,
      category,
      subject,
      description,
      status: 'open',
      severity,
      environment: (environment ?? null) as Json | null,
      meta: meta as Json,
    };

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert(insertPayload)
      .select('*')
      .single();

    if (ticketError || !ticket) {
      console.error('Support ticket insert error:', ticketError);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    const { data: message, error: messageError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        author_user_id: session?.user.id ?? null,
        author_role: 'user',
        message: description,
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
        const storagePath = `support/${ticket.id}/${message.id}/${Date.now()}-${safeName}`;
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
          ticket_id: ticket.id,
          message_id: message.id,
          uploader_user_id: session?.user.id ?? null,
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

    return ok({ ticket_id: ticket.id }, { status: 201 });
  } catch (error) {
    console.error('Support ticket create error:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

export const GET = withApiRoute(GETHandler);
export const POST = withApiRoute(POSTHandler);
