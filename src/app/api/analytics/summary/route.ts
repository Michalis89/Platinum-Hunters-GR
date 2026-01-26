import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
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
      { count: totalGuides, error: guidesError },
      { count: totalGames, error: gamesError },
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('last_login', since5m),
      supabase.from('guides').select('id', { count: 'exact', head: true }),
      supabase.from('games').select('id', { count: 'exact', head: true }),
    ]);

    const error = usersError || activeError || guidesError || gamesError;
    if (error) {
      console.error('❌ Analytics fetch error:', error);
      return NextResponse.json({ error: 'Σφάλμα φόρτωσης analytics' }, { status: 500 });
    }

    return NextResponse.json({
      total_users: totalUsers ?? 0,
      active_users_now: activeUsers ?? 0,
      total_guides: totalGuides ?? 0,
      total_games: totalGames ?? 0,
    });
  } catch (err) {
    console.error('❌ Analytics server error:', err);
    return NextResponse.json({ error: 'Σφάλμα φόρτωσης analytics' }, { status: 500 });
  }
}
