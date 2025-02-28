import { NextResponse } from 'next/server';
import supabase from '@/lib/db';
import { GameDetails } from '@/types/interfaces';

const RAWG_API_KEY = process.env.RAWG_API_KEY;

async function fetchGameInfo(gameTitle: string): Promise<GameDetails | null> {
  try {
    const searchResponse = await fetch(
      `https://api.rawg.io/api/games?search=${encodeURIComponent(gameTitle)}&key=${RAWG_API_KEY}`,
    );

    if (!searchResponse.ok) {
      console.error('❌ RAWG API error:', searchResponse.statusText);
      return null;
    }

    const searchData: { results: { slug: string }[] } = await searchResponse.json();

    if (searchData.results.length === 0) {
      console.warn('⚠️ No game found in RAWG API');
      return null;
    }

    const gameSlug = searchData.results[0].slug;
    console.log(`🔹 Found slug: ${gameSlug}`);

    const detailsResponse = await fetch(
      `https://api.rawg.io/api/games/${gameSlug}?key=${RAWG_API_KEY}`,
    );

    if (!detailsResponse.ok) {
      console.error('❌ RAWG API error (details):', detailsResponse.statusText);
      return null;
    }

    const game: {
      released?: string;
      developers?: { name: string }[];
      publishers?: { name: string }[];
      genres?: { name: string }[];
      slug: string;
      metacritic?: number;
      rating?: number;
      platforms?: { platform: { name: string } }[];
      esrb_rating?: { name: string };
    } = await detailsResponse.json();

    return {
      release_year: game.released ? parseInt(game.released.split('-')[0]) : null,
      developer: game.developers?.[0]?.name ?? null,
      publisher: game.publishers?.[0]?.name ?? null,
      genre: game.genres?.map(g => g.name).join(', ') ?? null,
      slug: game.slug,
      metacritic: game.metacritic ?? null,
      rating: game.rating ?? null,
      platforms: game.platforms?.map(p => p.platform.name) ?? null,
      esrb_rating: game.esrb_rating?.name ?? null,
    };
  } catch (error) {
    console.error('❌ RAWG API fetch error:', error);
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: Request, context: any) {
  try {
    const { params } = await context;
    const gameId = parseInt(params.id as string);

    if (isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }

    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select('title')
      .eq('id', gameId)
      .single();

    if (gameError ?? !gameData) {
      console.error('❌ Game not found in DB:', gameError);
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    const gameInfo = await fetchGameInfo(gameData.title);
    if (!gameInfo) {
      return NextResponse.json({ error: 'Game info not found' }, { status: 404 });
    }

    const { error } = await supabase.from('game_details').update(gameInfo).eq('game_id', gameId);

    if (error) {
      console.error('❌ Database update error:', error);
      return NextResponse.json({ error: 'Database update error' }, { status: 500 });
    }

    return NextResponse.json({
      message: '✅ Πληροφορίες ενημερώθηκαν επιτυχώς!',
      updatedData: gameInfo,
    });
  } catch (error) {
    console.error('❌ Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
