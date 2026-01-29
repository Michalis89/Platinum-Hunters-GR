import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function GET() {
  const supabase = supabaseAdmin();

  const [users, games, anime, manga, movies, tv, books, articles] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase
      .from('media_items')
      .select('id', { count: 'exact', head: true })
      .eq('category', 'games'),
    supabase
      .from('media_items')
      .select('id', { count: 'exact', head: true })
      .eq('category', 'anime'),
    supabase
      .from('media_items')
      .select('id', { count: 'exact', head: true })
      .eq('category', 'manga'),
    supabase
      .from('media_items')
      .select('id', { count: 'exact', head: true })
      .eq('category', 'movies'),
    supabase.from('media_items').select('id', { count: 'exact', head: true }).eq('category', 'tv'),
    supabase
      .from('media_items')
      .select('id', { count: 'exact', head: true })
      .eq('category', 'books'),
    supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
  ]);

  const errors = [users, games, anime, manga, movies, tv, books, articles]
    .map(r => r.error)
    .filter(Boolean);
  if (errors.length) {
    return NextResponse.json({ error: 'Failed to load public stats' }, { status: 500 });
  }

  return NextResponse.json({
    totalUsers: users.count ?? 0,
    totalGames: games.count ?? 0,
    totalAnime: anime.count ?? 0,
    totalManga: manga.count ?? 0,
    totalMovies: movies.count ?? 0,
    totalTv: tv.count ?? 0,
    totalBooks: books.count ?? 0,
    totalArticles: articles.count ?? 0,
  });
}
