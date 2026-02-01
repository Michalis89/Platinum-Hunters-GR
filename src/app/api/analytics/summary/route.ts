import { withApiRoute } from '@/lib/observability/withApiRoute';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function GETHandler() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey);

  try {
    const since5m = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const [
      { count: totalUsers, error: usersError },
      { count: activeUsers, error: activeError },
      { count: totalMediaItems, error: mediaError },
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('last_login', since5m),
      supabase.from('media_items').select('id', { count: 'exact', head: true }),
    ]);

    const error = usersError || activeError || mediaError;
    if (error) {
      console.error('Analytics fetch error:', error);
      return NextResponse.json({ error: 'Σφάλμα φόρτωσης analytics' }, { status: 500 });
    }

    return NextResponse.json({
      total_users: totalUsers ?? 0,
      active_users_now: activeUsers ?? 0,
      total_media_items: totalMediaItems ?? 0,
    });
  } catch (err) {
    console.error('Analytics server error:', err);
    return NextResponse.json({ error: 'Σφάλμα φόρτωσης analytics' }, { status: 500 });
  }
}

export const GET = withApiRoute(GETHandler);
