import { withApiRoute } from '@/lib/observability/withApiRoute';

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, okWithMeta } from '@/lib/api/response';
import { UnauthorizedError } from '@/lib/api/auth';
import { ForbiddenError } from '@/lib/api/permissions';
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

    return okWithMeta(data ?? [], { total: count ?? 0, limit, offset });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    if (error instanceof ForbiddenError) {
      return fail(API_ERRORS.FORBIDDEN, API_ERRORS.FORBIDDEN.status);
    }
    console.error('Admin support list error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const dynamic = 'force-dynamic';

export const GET = withApiRoute(GETHandler);
