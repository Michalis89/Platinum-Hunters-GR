import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, okWithMeta } from '@/lib/api/response';
import { UnauthorizedError } from '@/lib/api/auth';
import { ForbiddenError, requireAdminRole } from '@/lib/api/permissions';
import type {
  ApplicationLogLevel,
  ApplicationLogsDatabase,
} from '@/lib/observability/applicationLogger';
import type { SupabaseClient } from '@supabase/supabase-js';

const LEVELS = new Set<ApplicationLogLevel>(['info', 'warn', 'error']);

function isApplicationLogLevel(value: string): value is ApplicationLogLevel {
  return LEVELS.has(value as ApplicationLogLevel);
}

async function GETHandler(req: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    await requireAdminRole(supabase);
    const admin = createSupabaseAdminClient() as unknown as SupabaseClient<ApplicationLogsDatabase>;

    const { searchParams } = new URL(req.url);
    const level = searchParams.get('level');
    const query = searchParams.get('q');
    const path = searchParams.get('path');
    const MAX_LIMIT = 200;
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), MAX_LIMIT);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    let request = admin
      .from('application_logs')
      .select('id,created_at,level,source,message,details,path,method,status,duration_ms,user_id', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (level && isApplicationLogLevel(level)) {
      request = request.eq('level', level);
    }
    if (path) {
      request = request.ilike('path', `%${path}%`);
    }
    if (query) {
      const safeQuery = `%${query}%`;
      request = request.or(
        `message.ilike.${safeQuery},source.ilike.${safeQuery},path.ilike.${safeQuery}`,
      );
    }

    const { data, error, count } = await request;
    if (error) {
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
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const dynamic = 'force-dynamic';

export const GET = withApiRoute(GETHandler);
