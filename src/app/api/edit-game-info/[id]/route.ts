import { NextResponse } from 'next/server';
import getSupabaseServer from '@/lib/supabase-server';

type Params = Promise<{ id: string }>;

export async function POST(req: Request, context: { params: Params }) {
  try {
    const supabase = getSupabaseServer();
    const { id } = await context.params;
    const gameId = Number(id);

    if (Number.isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }

    const body = await req.json();
    const { release_year, developer, publisher, rating, metacritic, platforms } = body;

    // Get or create developer
    let developerId = null;
    if (developer) {
      const { data: devData } = await supabase
        .from('developers')
        .select('id')
        .eq('name', developer)
        .single();

      if (devData) {
        developerId = devData.id;
      } else {
        const { data: newDev } = await supabase
          .from('developers')
          .insert({
            name: developer,
            slug: developer.toLowerCase().replaceAll(/\s+/g, '-'),
          })
          .select('id')
          .single();
        developerId = newDev?.id;
      }
    }

    // Get or create publisher
    let publisherId = null;
    if (publisher) {
      const { data: pubData } = await supabase
        .from('publishers')
        .select('id')
        .eq('name', publisher)
        .single();

      if (pubData) {
        publisherId = pubData.id;
      } else {
        const { data: newPub } = await supabase
          .from('publishers')
          .insert({
            name: publisher,
            slug: publisher.toLowerCase().replaceAll(/\s+/g, '-'),
          })
          .select('id')
          .single();
        publisherId = newPub?.id;
      }
    }

    // Update game with basic info
    const { error: updateError } = await supabase
      .from('games')
      .update({
        release_year: release_year || null,
        developer_id: developerId,
        publisher_id: publisherId,
        metacritic_score: metacritic || null,
        rating: rating || null,
      })
      .eq('id', gameId);

    if (updateError) {
      console.error('❌ Database update error:', updateError);
      return NextResponse.json({ error: 'Database update error' }, { status: 500 });
    }

    // Handle platforms (if provided)
    if (platforms && Array.isArray(platforms) && platforms.length > 0) {
      // Delete existing platform associations
      await supabase.from('game_platforms').delete().eq('game_id', gameId);

      // Add new platforms
      for (const platformName of platforms) {
        let platformId = null;
        const { data: platformData } = await supabase
          .from('platforms')
          .select('id')
          .ilike('short_name', platformName)
          .single();

        if (platformData) {
          platformId = platformData.id;
        } else {
          const { data: newPlatform } = await supabase
            .from('platforms')
            .insert({ name: platformName, short_name: platformName })
            .select('id')
            .single();
          platformId = newPlatform?.id;
        }

        if (platformId) {
          await supabase.from('game_platforms').insert({ game_id: gameId, platform_id: platformId });
        }
      }
    }

    return NextResponse.json({
      message: '✅ Πληροφορίες ενημερώθηκαν επιτυχώς!',
      updatedData: {
        release_year,
        developer,
        publisher,
        rating,
        metacritic,
        platforms,
      },
    });
  } catch (error) {
    console.error('❌ Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
