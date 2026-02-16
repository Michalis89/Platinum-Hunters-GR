import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { randomUUID } from 'crypto';
import {
  fetchSteamOwnedGames,
  fetchSteamAchievements,
  getSteamApiKey,
  resolveSteamId64,
  type SteamOwnedGame,
} from '@/lib/integrations/steam';

type SteamGameWithAchievements = SteamOwnedGame & {
  achievementsPercent?: number;
};

async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  limit: number,
  mapper: (item: TInput, index: number) => Promise<TOutput>,
): Promise<TOutput[]> {
  const safeLimit = Math.max(1, limit);
  const results: TOutput[] = new Array(items.length);
  let readIndex = 0;

  const worker = async () => {
    while (readIndex < items.length) {
      const current = readIndex++;
      results[current] = await mapper(items[current], current);
    }
  };

  await Promise.all(Array.from({ length: Math.min(safeLimit, items.length) }, () => worker()));
  return results;
}

async function POSTHandler() {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);

    console.log('🚀 [Steam Sync Start] Initiating sync for user:', session.user.id);

    // Get user's Steam ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('steam_id')
      .eq('id', session.user.id)
      .maybeSingle();

    if (userError) {
      console.error('❌ [Steam Sync Start] User fetch error:', userError);
      throw userError;
    }

    const steamInput = userData?.steam_id?.trim();
    if (!steamInput) {
      console.error('❌ [Steam Sync Start] No steam_id in user profile');
      throw new Error('You have not set a Steam ID in your profile. Go to settings to add it.');
    }

    console.log('🔑 [Steam Sync Start] Fetching Steam API key...');
    const apiKey = getSteamApiKey();

    console.log('🎮 [Steam Sync Start] Resolving Steam ID64...');
    const steamId64 = await resolveSteamId64({ apiKey, steamInput });

    console.log('📚 [Steam Sync Start] Fetching owned games...');
    const steamGames = await fetchSteamOwnedGames({ apiKey, steamId64 });

    // Filter and deduplicate games
    const uniqueGames = Array.from(
      new Map(steamGames.map(game => [game.appid, game] as const)).values(),
    ).filter(game => typeof game.appid === 'number' && game.appid > 0 && game.name);

    console.log(`📊 [Steam Sync Start] Found ${uniqueGames.length} unique games`);

    if (uniqueGames.length === 0) {
      return NextResponse.json({
        jobId: null,
        totalGames: 0,
        message: 'No games were found in the Steam library.',
      });
    }

    console.log('🏆 [Steam Sync Start] Fetching achievements...');
    const achievementsPercentByAppId = new Map<number, number>();
    const gamesWithStats = uniqueGames.filter(g => g.has_community_visible_stats);

    if (gamesWithStats.length > 0) {
      await mapWithConcurrency(
        gamesWithStats,
        2, // Conservative concurrency to avoid rate limits
        async game => {
          const result = await fetchSteamAchievements({ apiKey, steamId64, appid: game.appid });
          if (result && result.percent > 0) {
            achievementsPercentByAppId.set(game.appid, result.percent);
          }
          return result;
        },
      );
    }

    // Merge achievements data into games
    const gamesWithAchievements: SteamGameWithAchievements[] = uniqueGames.map(game => ({
      ...game,
      achievementsPercent: achievementsPercentByAppId.get(game.appid),
    }));

    // Create job record
    const jobId = randomUUID();
    // Dynamic batch size based on library size for better performance
    // Small libraries: 25 games/batch, Medium: 40, Large (500+): 50
    const batchSize = uniqueGames.length < 100 ? 25 : uniqueGames.length < 500 ? 40 : 50;

    const { error: insertError } = await supabase.from('steam_sync_jobs').insert({
      id: jobId,
      user_id: session.user.id,
      status: 'running',
      message: `Preparing to process ${uniqueGames.length} games...`,
      percent: 0,
      completed_steps: 0,
      total_steps: uniqueGames.length,
      steam_games: gamesWithAchievements,
      processed_count: 0,
      batch_size: batchSize,
    });

    if (insertError) {
      console.error('❌ [Steam Sync Start] Failed to create job:', insertError);
      throw new Error('Failed to create sync job');
    }

    console.log(`✅ [Steam Sync Start] Job created: ${jobId}`);

    return NextResponse.json({
      jobId,
      totalGames: uniqueGames.length,
      batchSize,
      estimatedBatches: Math.ceil(uniqueGames.length / batchSize),
      message: `${uniqueGames.length} games found. Ready for processing.`,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : 'Failed to start Steam sync';
    console.error('❌ [Steam Sync Start] Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withApiRoute(POSTHandler);

// This endpoint should complete quickly (< 30 seconds even for 1000+ game libraries)
// because it only fetches Steam data and achievements, doesn't do IGDB matching/enrichment
// Achievement fetching is the slowest part but runs with concurrency limit of 2
export const maxDuration = 60;
