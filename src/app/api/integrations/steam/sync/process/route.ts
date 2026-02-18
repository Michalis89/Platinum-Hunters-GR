import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import type { Database } from '@/lib/supabase/database.types';
import type { IgdbGame } from '@/lib/services/igdbService';
import {
  type SteamGameWithAchievements,
  matchSteamGamesToIgdb,
  enrichIgdbMatches,
  buildGameMetadataPatch,
  deriveStatusFromSteamData,
  normalizeTitle,
  getSteamHours,
  mapWithConcurrency,
} from '@/lib/integrations/steam-sync-helpers';
import { refreshGenreAffinity } from '@/lib/profile/genre-affinity';

type ProcessResult = {
  processed: number;
  totalGames: number;
  isComplete: boolean;
  percent: number;
  message: string;
  rejectedGames?: Array<{ appid: number; name: string; reason: string }>;
};

async function POSTHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    const adminSupabase = createSupabaseAdminClient();
    const session = await requireAuth(supabase);

    // Fetch job
    const { data: job, error: jobError } = await supabase
      .from('steam_sync_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status === 'completed') {
      return NextResponse.json({
        processed: job.processed_count || 0,
        totalGames: job.total_steps,
        isComplete: true,
        percent: 100,
        message: 'Steam sync is already completed',
      } satisfies ProcessResult);
    }

    if (job.status === 'failed') {
      return NextResponse.json({ error: job.error || 'Job failed' }, { status: 500 });
    }

    const allGames = (job.steam_games as SteamGameWithAchievements[]) || [];
    const processedCount = job.processed_count || 0;
    const batchSize = job.batch_size || 25;
    const batch = allGames.slice(processedCount, processedCount + batchSize);

    if (batch.length === 0) {
      await supabase
        .from('steam_sync_jobs')
        .update({
          status: 'completed',
          message: 'Steam sync completed successfully',
          percent: 100,
          finished_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      return NextResponse.json({
        processed: processedCount,
        totalGames: allGames.length,
        isComplete: true,
        percent: 100,
        message: 'Steam sync completed successfully',
      } satisfies ProcessResult);
    }

    await supabase
      .from('steam_sync_jobs')
      .update({
        message: `Processing games ${processedCount + 1}-${processedCount + batch.length} of ${allGames.length}...`,
      })
      .eq('id', jobId);

    const igdbMatchByAppId = await matchSteamGamesToIgdb(batch);

    const appIds = batch.map(game => game.appid);
    const { data: existingMediaRows } = await adminSupabase
      .from('media_items')
      .select('id,steam_app_id,rawg_id,source')
      .eq('category', 'games')
      .in('steam_app_id', appIds);

    const mediaByAppId = new Map<
      number,
      { id: number; steam_app_id: number | null; rawg_id: number | null; source: string | null }
    >();
    for (const row of existingMediaRows ?? []) {
      if (typeof row.steam_app_id === 'number') {
        mediaByAppId.set(row.steam_app_id, row);
      }
    }

    const igdbMatchesNeedingEnrichment = new Map<number, IgdbGame | null>();
    const igdbMatchesAlreadyEnriched = new Map<number, IgdbGame | null>();

    for (const [appid, igdbMatch] of igdbMatchByAppId.entries()) {
      if (!igdbMatch) {
        igdbMatchesNeedingEnrichment.set(appid, null);
        continue;
      }

      const existingMedia = mediaByAppId.get(appid);
      const alreadyEnriched =
        existingMedia && existingMedia.rawg_id === igdbMatch.id && existingMedia.source === 'igdb';

      if (alreadyEnriched) {
        igdbMatchesAlreadyEnriched.set(appid, igdbMatch);
      } else {
        igdbMatchesNeedingEnrichment.set(appid, igdbMatch);
      }
    }

    const enrichedIgdbByAppId = await enrichIgdbMatches(igdbMatchesNeedingEnrichment);
    for (const [appid, match] of igdbMatchesAlreadyEnriched.entries()) {
      enrichedIgdbByAppId.set(appid, match);
    }

    const allMatchedIgdbIds = Array.from(
      new Set(
        batch
          .map(game => enrichedIgdbByAppId.get(game.appid)?.id)
          .filter((id): id is number => typeof id === 'number'),
      ),
    );

    const existingIgdbMediaByIgdbId = new Map<number, { id: number; rawg_id: number | null }>();
    if (allMatchedIgdbIds.length > 0) {
      const { data: igdbRows } = await adminSupabase
        .from('media_items')
        .select('id,rawg_id')
        .eq('category', 'games')
        .in('rawg_id', allMatchedIgdbIds);

      for (const row of igdbRows ?? []) {
        if (typeof row.rawg_id === 'number') {
          existingIgdbMediaByIgdbId.set(row.rawg_id, row);
        }
      }
    }

    // Build a map of existing games by normalized title to catch duplicates
    const { data: allGamesRows } = await adminSupabase
      .from('media_items')
      .select('id,title,title_english,steam_app_id,rawg_id,source')
      .eq('category', 'games');

    const existingMediaByNormalizedTitle = new Map<
      string,
      { id: number; steam_app_id: number | null; rawg_id: number | null; source: string | null }
    >();
    for (const row of allGamesRows ?? []) {
      const normalizedTitle = normalizeTitle(row.title);
      const normalizedEnglishTitle = normalizeTitle(row.title_english);
      if (normalizedTitle) {
        existingMediaByNormalizedTitle.set(normalizedTitle, row);
      }
      if (normalizedEnglishTitle && normalizedEnglishTitle !== normalizedTitle) {
        existingMediaByNormalizedTitle.set(normalizedEnglishTitle, row);
      }
    }

    const mediaIdByAppId = new Map<number, number>();
    const insertTasks: Array<{
      appid: number;
      payload: Database['public']['Tables']['media_items']['Insert'];
    }> = [];
    const updateByMediaId = new Map<
      number,
      Database['public']['Tables']['media_items']['Update']
    >();
    const rejectedGames: Array<{ appid: number; name: string; reason: string }> = [];

    for (const game of batch) {
      const matchedIgdb = enrichedIgdbByAppId.get(game.appid) ?? null;
      const existingByAppId = mediaByAppId.get(game.appid);

      if (existingByAppId) {
        mediaIdByAppId.set(game.appid, existingByAppId.id);

        const isAlreadyEnriched = existingByAppId.source === 'igdb' && existingByAppId.rawg_id;

        if (isAlreadyEnriched) {
          updateByMediaId.set(existingByAppId.id, {
            steam_app_id: game.appid,
            runtime: getSteamHours(game),
          });
        } else if (matchedIgdb) {
          updateByMediaId.set(existingByAppId.id, buildGameMetadataPatch(game, matchedIgdb));
        } else {
          updateByMediaId.set(existingByAppId.id, {
            steam_app_id: game.appid,
            runtime: getSteamHours(game),
          });
        }
        continue;
      }

      if (matchedIgdb) {
        const existingIgdbMedia = existingIgdbMediaByIgdbId.get(matchedIgdb.id);
        if (existingIgdbMedia) {
          mediaIdByAppId.set(game.appid, existingIgdbMedia.id);
          updateByMediaId.set(existingIgdbMedia.id, {
            steam_app_id: game.appid,
            runtime: getSteamHours(game),
          });
          continue;
        }

        // Check for duplicates by normalized title
        const normalizedGameTitle = normalizeTitle(game.name);
        const existingByTitle = normalizedGameTitle
          ? existingMediaByNormalizedTitle.get(normalizedGameTitle)
          : null;

        if (existingByTitle) {
          mediaIdByAppId.set(game.appid, existingByTitle.id);
          console.warn(
            `[Steam Sync] Found duplicate by title: ${game.name} - Updating existing media ID ${existingByTitle.id} instead of inserting`,
          );
          // Update the existing media item with IGDB data + steam_app_id
          updateByMediaId.set(existingByTitle.id, buildGameMetadataPatch(game, matchedIgdb));
          continue;
        }

        insertTasks.push({
          appid: game.appid,
          payload: {
            category: 'games',
            ...buildGameMetadataPatch(game, matchedIgdb),
          },
        });
      } else {
        // Reject games that don't have IGDB match
        rejectedGames.push({
          appid: game.appid,
          name: game.name ?? `Steam App ${game.appid}`,
          reason: 'Not found in IGDB database',
        });
      }
    }

    if (insertTasks.length > 0) {
      const { data: insertedMediaRows, error: mediaInsertError } = await adminSupabase
        .from('media_items')
        .insert(insertTasks.map(item => item.payload))
        .select('id,steam_app_id');

      if (!mediaInsertError) {
        for (const row of insertedMediaRows ?? []) {
          if (typeof row.steam_app_id === 'number') {
            mediaIdByAppId.set(row.steam_app_id, row.id);
          }
        }
      } else {
        await mapWithConcurrency(insertTasks, 4, async task => {
          const { data } = await adminSupabase
            .from('media_items')
            .insert(task.payload)
            .select('id,steam_app_id')
            .single();

          if (data && typeof data.steam_app_id === 'number') {
            mediaIdByAppId.set(data.steam_app_id, data.id);
          }
          return data;
        });
      }
    }

    if (updateByMediaId.size > 0) {
      await mapWithConcurrency(
        Array.from(updateByMediaId.entries()),
        8,
        async ([mediaId, updatePayload]) => {
          await adminSupabase.from('media_items').update(updatePayload).eq('id', mediaId);
          return true;
        },
      );
    }

    const mediaIds = Array.from(mediaIdByAppId.values());
    const { data: existingEntryRows } = await supabase
      .from('user_media_entries')
      .select('media_id,import_source,status,updated_at')
      .eq('user_id', session.user.id)
      .in('media_id', mediaIds);

    const existingEntryByMediaId = new Map<
      number,
      { import_source: string | null; status: string; updated_at: string | null }
    >();
    for (const row of existingEntryRows ?? []) {
      existingEntryByMediaId.set(row.media_id, {
        import_source: row.import_source ?? null,
        status: row.status,
        updated_at: row.updated_at,
      });
    }

    const { data: userGameRows } = await supabase
      .from('user_media_entries')
      .select('media_items!inner(title,title_english,category)')
      .eq('user_id', session.user.id)
      .eq('media_items.category', 'games');

    const userTitleSet = new Set<string>();
    for (const row of userGameRows ?? []) {
      const media = row.media_items as {
        title?: string | null;
        title_english?: string | null;
      } | null;
      const normalizedTitle = normalizeTitle(media?.title);
      const normalizedEnglishTitle = normalizeTitle(media?.title_english);
      if (normalizedTitle) {
        userTitleSet.add(normalizedTitle);
      }
      if (normalizedEnglishTitle) {
        userTitleSet.add(normalizedEnglishTitle);
      }
    }

    const userEntryPayload: Database['public']['Tables']['user_media_entries']['Insert'][] = [];
    const userEntryUpdates: Database['public']['Tables']['user_media_entries']['Insert'][] = [];

    for (const game of batch) {
      const mediaId = mediaIdByAppId.get(game.appid);
      if (!mediaId) {
        continue;
      }

      const existingEntry = existingEntryByMediaId.get(mediaId);
      const derivedStatus = deriveStatusFromSteamData({
        playtimeMinutes: game.playtime_forever,
        lastPlayedUnix: game.rtime_last_played,
        achievementsPercent: game.achievementsPercent,
      });

      if (existingEntry !== undefined) {
        if (existingEntry.import_source === 'steam') {
          userEntryUpdates.push({
            user_id: session.user.id,
            media_id: mediaId,
            status: derivedStatus,
            progress: getSteamHours(game) ?? 0,
            import_source: 'steam',
            selected_platform: 'PC',
          });
        }
        continue;
      }

      const normalizedSteamTitle = normalizeTitle(game.name);
      if (normalizedSteamTitle && userTitleSet.has(normalizedSteamTitle)) {
        continue;
      }

      userEntryPayload.push({
        user_id: session.user.id,
        media_id: mediaId,
        status: derivedStatus,
        progress: getSteamHours(game) ?? 0,
        import_source: 'steam',
        selected_platform: 'PC',
      });

      if (normalizedSteamTitle) {
        userTitleSet.add(normalizedSteamTitle);
      }
    }

    if (userEntryPayload.length > 0) {
      await supabase
        .from('user_media_entries')
        .upsert(userEntryPayload, { onConflict: 'user_id,media_id' });
    }

    if (userEntryUpdates.length > 0) {
      await supabase
        .from('user_media_entries')
        .upsert(userEntryUpdates, { onConflict: 'user_id,media_id' });
    }

    const newProcessedCount = processedCount + batch.length;
    const newPercent = Math.min(100, Math.round((newProcessedCount / allGames.length) * 100));
    const isComplete = newProcessedCount >= allGames.length;

    await supabase
      .from('steam_sync_jobs')
      .update({
        processed_count: newProcessedCount,
        completed_steps: newProcessedCount,
        percent: newPercent,
        message: isComplete
          ? 'Steam sync completed successfully'
          : `Processed ${newProcessedCount} of ${allGames.length} games`,
        ...(isComplete && {
          status: 'completed',
          finished_at: new Date().toISOString(),
        }),
      })
      .eq('id', jobId);

    // Recompute genre affinity when sync completes
    if (isComplete) {
      void refreshGenreAffinity(supabase, session.user.id);
    }

    return NextResponse.json({
      processed: newProcessedCount,
      totalGames: allGames.length,
      isComplete,
      percent: newPercent,
      message: isComplete
        ? 'Steam sync completed successfully'
        : `Processed ${newProcessedCount} of ${allGames.length} games`,
      rejectedGames: rejectedGames.length > 0 ? rejectedGames : undefined,
    } satisfies ProcessResult);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : 'Failed to process batch';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withApiRoute(POSTHandler);

// Increased timeout for larger batches (up to 50 games with IGDB matching/enrichment)
// Direct Steam App ID lookup is much faster, but text search fallback needs time
export const maxDuration = 30;
