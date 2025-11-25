import { NextResponse } from 'next/server';
import getSupabaseServer from '@/lib/supabase-server';
import { GameDetails } from '@/types/interfaces';

const RAWG_API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;

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
      release_year: game.released ? Number.parseInt(game.released.split('-')[0]) : null,
      developer: game.developers?.[0]?.name ?? null,
      publisher: game.publishers?.[0]?.name ?? null,
      genre: game.genres?.[0]?.name ?? null, // Take first genre for compatibility
      genres: game.genres?.map(g => g.name) ?? null, // Store all genres as array
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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabaseServer();
    const { id } = await params;
    const gameId = Number.parseInt(id);

    if (Number.isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }

    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select('title')
      .eq('id', gameId)
      .single();

    if (gameError ?? !gameData) {
      console.error('❌ Game not found in DB:', gameError);
      return NextResponse.json({ error: 'Game info not found' }, { status: 404 });
    }

    const gameInfo = await fetchGameInfo(gameData.title);
    if (!gameInfo) {
      return NextResponse.json({ error: 'Game info not found' }, { status: 404 });
    }

    // Get or create developer
    let developerId = null;
    if (gameInfo.developer) {
      const { data: devData, error: devError } = await supabase
        .from('developers')
        .select('id')
        .eq('name', gameInfo.developer)
        .single();

      if (devData) {
        developerId = devData.id;
      } else if (devError?.code === 'PGRST116') {
        // Not found, create new
        const { data: newDev, error: insertError } = await supabase
          .from('developers')
          .insert({
            name: gameInfo.developer,
            slug: gameInfo.developer.toLowerCase().replaceAll(/\s+/g, '-'),
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('❌ Failed to create developer:', insertError);
        } else {
          developerId = newDev?.id;
        }
      } else {
        console.error('❌ Error querying developer:', devError);
      }
    }

    // Get or create publisher
    let publisherId = null;
    if (gameInfo.publisher) {
      const { data: pubData, error: pubError } = await supabase
        .from('publishers')
        .select('id')
        .eq('name', gameInfo.publisher)
        .single();

      if (pubData) {
        publisherId = pubData.id;
      } else if (pubError?.code === 'PGRST116') {
        // Not found, create new
        const { data: newPub, error: insertError } = await supabase
          .from('publishers')
          .insert({
            name: gameInfo.publisher,
            slug: gameInfo.publisher.toLowerCase().replaceAll(/\s+/g, '-'),
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('❌ Failed to create publisher:', insertError);
        } else {
          publisherId = newPub?.id;
        }
      } else {
        console.error('❌ Error querying publisher:', pubError);
      }
    }

    // Update game with basic info
    const { error: updateError } = await supabase
      .from('games')
      .update({
        release_year: gameInfo.release_year,
        developer_id: developerId,
        publisher_id: publisherId,
        metacritic_score: gameInfo.metacritic,
        rating: gameInfo.rating,
      })
      .eq('id', gameId);

    if (updateError) {
      console.error('❌ Database update error:', updateError);
      return NextResponse.json(
        { error: 'Database update error', details: updateError.message },
        { status: 500 },
      );
    }

    // Handle genres (many-to-many)
    if (gameInfo.genres && gameInfo.genres.length > 0) {
      // Delete existing genre associations
      await supabase.from('game_genres').delete().eq('game_id', gameId);

      // Add new genres
      for (const genreName of gameInfo.genres) {
        // Get or create genre
        let genreId = null;
        const { data: genreData } = await supabase
          .from('genres')
          .select('id')
          .eq('name', genreName)
          .single();

        if (genreData) {
          genreId = genreData.id;
        } else {
          const { data: newGenre } = await supabase
            .from('genres')
            .insert({ name: genreName, slug: genreName.toLowerCase().replaceAll(/\s+/g, '-') })
            .select('id')
            .single();
          genreId = newGenre?.id;
        }

        if (genreId) {
          await supabase.from('game_genres').insert({ game_id: gameId, genre_id: genreId });
        }
      }
    }

    // Handle platforms (many-to-many)
    if (gameInfo.platforms && gameInfo.platforms.length > 0) {
      // Delete existing platform associations
      await supabase.from('game_platforms').delete().eq('game_id', gameId);

      // Add new platforms
      for (const platformName of gameInfo.platforms) {
        // Get or create platform
        let platformId = null;
        const { data: platformData } = await supabase
          .from('platforms')
          .select('id')
          .ilike('name', platformName)
          .single();

        if (platformData) {
          platformId = platformData.id;
        } else {
          // Create short_name from name (e.g., "PlayStation 4" -> "PS4")
          const shortName = platformName.replace(/PlayStation/i, 'PS').replaceAll(/\s+/g, '');
          const { data: newPlatform } = await supabase
            .from('platforms')
            .insert({ name: platformName, short_name: shortName })
            .select('id')
            .single();
          platformId = newPlatform?.id;
        }

        if (platformId) {
          await supabase
            .from('game_platforms')
            .insert({ game_id: gameId, platform_id: platformId });
        }
      }
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
