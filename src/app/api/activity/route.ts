import { withApiRoute } from '@/lib/observability/withApiRoute';

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { AUTH_ERROR } from '@/lib/constants/messages';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

async function GETHandler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') === 'me' ? 'me' : 'global';
    const limitParam = Number.parseInt(searchParams.get('limit') || '', 10);
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), MAX_LIMIT)
      : DEFAULT_LIMIT;

    const supabase = await createRouteHandlerClient();

    const query = supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (scope === 'me') {
      const session = await requireAuth(supabase);
      query.eq('user_id', session.user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to load activity:', error);
      return NextResponse.json({ error: 'Activity loading error' }, { status: 500 });
    }

    return NextResponse.json({ activities: data ?? [] });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: AUTH_ERROR }, { status: 401 });
    }
    console.error('Activity API error:', err);
    return NextResponse.json({ error: 'Activity loading error' }, { status: 500 });
  }
}

export const GET = withApiRoute(GETHandler);
