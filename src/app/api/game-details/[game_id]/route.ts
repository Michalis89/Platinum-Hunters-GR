import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET(req: Request, props: { params: Promise<{ game_id: string }> }) {
  const params = await props.params;
  try {
    const gameId = params.game_id;

    if (!gameId) {
      return NextResponse.json({ error: 'Λάθος ID παιχνιδιού' }, { status: 400 });
    }

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

    // Transform to match GameDetails interface
    const gameDetails = {
      release_year: data.release_year,
      developer: data.developer,
      publisher: data.publisher,
      genre: data.genres?.[0] || null, // Take first genre for compatibility
      slug: data.slug,
      metacritic: data.metacritic_score,
      rating: data.rating,
      platforms: data.platforms,
    };

    return NextResponse.json(gameDetails);
  } catch (error) {
    console.error('❌ Σφάλμα διακομιστή:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
