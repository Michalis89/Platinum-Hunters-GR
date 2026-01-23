import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

async function insertActivity(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  userId: string,
  payload: Record<string, unknown>,
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('activity_log') as any).insert({
      user_id: userId,
      type: 'guide_created',
      payload,
    });
  } catch (err) {
    console.warn('⚠️ Activity insert (guide_created) failed:', err);
  }
}

interface ScrapedStep {
  title: string;
  description: string;
  trophies?: unknown[];
  content_rich?: unknown;
  content_html?: string | null;
}

export async function POST(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createRouteHandlerClient()) as any;

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Μη εξουσιοδοτημένη πρόσβαση' }, { status: 401 });
    }

    const {
      title,
      platform,
      gameImage,
      release_year,
      rating,
      metacritic,
      trophies,
      difficulty,
      hours,
      playthroughs,
      steps,
      content_rich: guideContentRich,
      content_html: guideContentHtml,
      description,
      background_image,
    } = await req.json();

    // Create slug from title
    const slug = title
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/(^-+)|(-+$)/g, '');

    // Check if game already exists by title
    const { data: existingGame } = await supabase
      .from('games')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (existingGame) {
      return NextResponse.json(
        {
          message: `⚠️ Ο οδηγός "${existingGame.title}" υπάρχει ήδη στη βάση!`,
          existingData: existingGame,
        },
        { status: 409 },
      );
    }

    // Insert game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert([
        {
          title,
          slug,
          cover_image: gameImage,
          background_image: background_image ?? gameImage,
          trophy_platinum: parseInt(trophies?.Platinum) || 0,
          trophy_gold: parseInt(trophies?.Gold) || 0,
          trophy_silver: parseInt(trophies?.Silver) || 0,
          trophy_bronze: parseInt(trophies?.Bronze) || 0,
          release_year: release_year ?? null,
          rating: rating ?? null,
          metacritic_score: metacritic ?? null,
        },
      ])
      .select('*')
      .single();

    if (gameError) {
      console.error('❌ Σφάλμα αποθήκευσης παιχνιδιού:', gameError);
      return NextResponse.json({ error: 'Database insert error' }, { status: 500 });
    }

    console.log(`✅ Αποθηκεύτηκε το παιχνίδι: ${game.title} με ID: ${game.id}`);

    // Handle platform - find or create platform and link it
    if (platform) {
      const { data: platformData } = await supabase
        .from('platforms')
        .select('id')
        .eq('short_name', platform)
        .maybeSingle();

      let platformId = platformData?.id;

      if (!platformId) {
        const { data: newPlatform } = await supabase
          .from('platforms')
          .insert({ name: platform, short_name: platform })
          .select('id')
          .single();
        platformId = newPlatform?.id;
      }

      if (platformId) {
        await supabase.from('game_platforms').insert({ game_id: game.id, platform_id: platformId });
      }
    }

    // Parse difficulty to rating (1-10 scale)
    const difficultyRating = Number.parseFloat(difficulty) || null;
    const estimatedHours = Number.parseFloat(hours) || null;
    const estimatedPlaythroughs = Number.parseInt(playthroughs) || 1;

    // Insert guide
    const { data: guide, error: guideError } = await supabase
      .from('guides')
      .insert([
        {
          game_id: game.id,
          title: `${title} Trophy Guide`,
          description: description ?? null,
          difficulty_rating: difficultyRating,
          estimated_hours: estimatedHours,
          estimated_playthroughs: estimatedPlaythroughs,
          status: 'published',
          content_rich: guideContentRich ?? null,
          content_html: guideContentHtml ?? null,
        },
      ])
      .select('*')
      .single();

    if (guideError) {
      console.error('❌ Σφάλμα αποθήκευσης guide:', guideError);
      return NextResponse.json({ error: 'Guide insert error' }, { status: 500 });
    }

    console.log(`✅ Οδηγός δημιουργήθηκε με ID: ${guide.id}`);

    // Insert guide steps
    if (steps && Array.isArray(steps) && steps.length > 0) {
      const guideSteps = steps.map((step: ScrapedStep, index: number) => ({
        guide_id: guide.id,
        step_number: index + 1,
        title: step.title,
        description: step.description,
        content_rich: step.content_rich ?? null,
        content_html: step.content_html ?? null,
      }));

      const { error: stepsError } = await supabase.from('guide_steps').insert(guideSteps);

      if (stepsError) {
        console.error('❌ Σφάλμα αποθήκευσης steps:', stepsError);
      } else {
        console.log(`✅ Αποθηκεύτηκαν ${steps.length} steps`);
      }
    }

    // Activity log for guide_created
    const profile = await supabase
      .from('users')
      .select('username, display_name, avatar_url')
      .eq('id', session.user.id)
      .maybeSingle();

    await insertActivity(supabase, session.user.id, {
      guideId: guide.id,
      guideTitle: guide.title,
      gameId: game.id,
      gameTitle: game.title,
      gameSlug: game.slug,
      username: profile.data?.username,
      display_name: profile.data?.display_name,
      avatar_url: profile.data?.avatar_url,
    });

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
