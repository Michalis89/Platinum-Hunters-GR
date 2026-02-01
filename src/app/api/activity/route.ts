import { withApiRoute } from '@/lib/observability/withApiRoute';

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

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

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (scope === 'me' && !session) {
      return NextResponse.json({ error: 'Μη εξουσιοδοτημένη πρόσβαση' }, { status: 401 });
    }

    const query = supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (scope === 'me' && session?.user?.id) {
      query.eq('user_id', session.user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Σφάλμα φόρτωσης activity:', error);
      return NextResponse.json({ error: 'Σφάλμα φόρτωσης activity' }, { status: 500 });
    }

    return NextResponse.json({ activities: data ?? [] });
  } catch (err) {
    console.error('❌ Activity API error:', err);
    return NextResponse.json({ error: 'Σφάλμα φόρτωσης activity' }, { status: 500 });
  }
}

export const GET = withApiRoute(GETHandler);
