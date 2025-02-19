import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function POST(req: Request) {
  try {
    const {
      title,
      platform,
      gameImage,
      trophies,
      difficulty,
      difficultyColor,
      playthroughs,
      playthroughsColor,
      hours,
      hoursColor,
      steps,
    } = await req.json();

    const { data: existingGame, error: searchError } = await supabase
      .from('games')
      .select('*')
      .eq('title', title)
      .eq('platform', platform)
      .single();

    if (existingGame) {
      return NextResponse.json(
        {
          message: `⚠️ Ο οδηγός "${existingGame.title}" υπάρχει ήδη στη βάση!`,
          existingData: existingGame,
        },
        { status: 409 },
      );
    }

    if (searchError && searchError.code !== 'PGRST116') {
      console.error('❌ Σφάλμα αναζήτησης στη βάση:', searchError);
      return NextResponse.json({ error: 'Database search error' }, { status: 500 });
    }

    // 📝 Εισαγωγή νέου παιχνιδιού
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert([
        {
          title,
          platform,
          game_image: gameImage,
          platinum: parseInt(trophies?.Platinum) || 0,
          gold: parseInt(trophies?.Gold) || 0,
          silver: parseInt(trophies?.Silver) || 0,
          bronze: parseInt(trophies?.Bronze) || 0,
        },
      ])
      .select('*')
      .single();

    if (gameError) {
      console.error('❌ Σφάλμα αποθήκευσης παιχνιδιού:', gameError);
      return NextResponse.json({ error: 'Database insert error' }, { status: 500 });
    }

    console.log(`✅ Αποθηκεύτηκε το παιχνίδι: ${game.title} με ID: ${game.id}`);

    // ✅ **Προσθήκη entry στο `game_details` με NULL τιμές**
    const { error: gameDetailsError } = await supabase.from('game_details').insert({
      game_id: game.id,
      release_year: null,
      developer: null,
      publisher: null,
      genre: null,
      slug: null,
      metacritic: null,
      rating: null,
      platforms: null,
      esrb_rating: null,
    });

    if (gameDetailsError) {
      console.error('❌ Σφάλμα εισαγωγής στο `game_details`:', gameDetailsError);
    } else {
      console.log(`✅ Προστέθηκε αρχικό entry στο game_details για το game_id: ${game.id}`);
    }

    // 🔹 Αποθήκευση του guide με το game_id
    const { data: guide, error: guideError } = await supabase
      .from('guides')
      .insert([
        {
          game_id: game.id,
          difficulty,
          difficulty_color: difficultyColor,
          playthroughs,
          playthroughs_color: playthroughsColor,
          hours,
          hours_color: hoursColor,
          steps,
        },
      ])
      .select('*')
      .single();

    if (guideError) {
      console.error('❌ Σφάλμα αποθήκευσης guide:', guideError);
      return NextResponse.json({ error: 'Guide insert error' }, { status: 500 });
    }

    console.log(`✅ Οδηγός αποθηκεύτηκε επιτυχώς για το ${game.title}`);

    return NextResponse.json({
      message: '✅ Ο οδηγός αποθηκεύτηκε!',
      game,
      guide,
    });
  } catch (error) {
    console.error('❌ Σφάλμα αποθήκευσης:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
