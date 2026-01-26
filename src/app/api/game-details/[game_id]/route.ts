import { NextResponse } from 'next/server';
import getSupabaseServer from '@/lib/supabase-server';

export async function GET(req: Request, props: { params: Promise<{ game_id: string }> }) {
  const params = await props.params;
  try {
    const gameIdParam = params.game_id;
    const gameId = Number.parseInt(gameIdParam, 10);

    if (!gameIdParam || Number.isNaN(gameId)) {
      return NextResponse.json({ error: 'Λάθος ID παιχνιδιού' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from('full_game_data')
      .select('release_year, developer, publisher, genres, slug, metacritic_score, rating, platforms')
      .eq('id', gameId)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Game details not found' }, { status: 404 });
    }

    // Fetch esrb_rating directly from games (view may not include it)
    const { data: gameRow } = await supabase
      .from('games')
      .select('esrb_rating')
      .eq('id', gameId)
      .single();

    // Fallback fetch for genres from game_genres if view returns empty
    let genresList: string[] | null = data.genres ?? null;
    if (!genresList || genresList.length === 0) {
      const { data: genreRows, error: genreError } = await supabase
        .from('game_genres')
        .select('genres(name)')
        .eq('game_id', gameId);
      if (genreError) {
        console.error('❌ Genre fetch error:', genreError);
      } else if (genreRows) {
        const normalizedRows = (genreRows as Array<{ genres?: { name?: string } | null }>) ?? [];
        genresList = normalizedRows
          .map(row => row.genres?.name)
          .filter((g): g is string => Boolean(g));
      }
    }

    // Transform to match GameDetails interface
    const gameDetails = {
      release_year: data.release_year,
      developer: data.developer,
      publisher: data.publisher,
      genre: genresList?.[0] || null, // Take first genre for compatibility
      genres: genresList ?? null,
      slug: data.slug,
      metacritic: data.metacritic_score,
      rating: data.rating,
      platforms: data.platforms,
      esrb_rating: gameRow?.esrb_rating ?? null,
    };

    return NextResponse.json(gameDetails);
  } catch (error) {
    console.error('❌ Σφάλμα διακομιστή:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
