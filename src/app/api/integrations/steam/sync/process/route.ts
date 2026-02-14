import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import type { Database } from '@/lib/supabase/database.types';
import type { RawgGame } from '@/lib/services/rawgService';
import {
  type SteamGameWithAchievements,
  matchSteamGamesToRawg,
  enrichRawgMatches,
  buildGameMetadataPatch,
  buildSteamFallbackInsert,
  deriveStatusFromSteamData,
  normalizeTitle,
  getSteamHours,
  mapWithConcurrency,
} from '@/lib/integrations/steam-sync-helpers';

type ProcessResult = {
  processed: number;
  totalGames: number;
  isComplete: boolean;
  percent: number;
  message: string;
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

    console.log(`🔄 [Steam Sync Process] Processing batch for job: ${jobId}`);

    // Fetch job
    const { data: job, error: jobError } = await supabase
      .from('steam_sync_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (jobError || !job) {
      console.error('❌ [Steam Sync Process] Job not found:', jobError);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status === 'completed') {
      return NextResponse.json({
        processed: job.processed_count || 0,
        totalGames: job.total_steps,
        isComplete: true,
        percent: 100,
        message: 'Ο συγχρονισμός έχει ήδη ολοκληρωθεί',
      } satisfies ProcessResult);
    }

    if (job.status === 'failed') {
      return NextResponse.json({ error: job.error || 'Job failed' }, { status: 500 });
    }

    const allGames = (job.steam_games as SteamGameWithAchievements[]) || [];
    const processedCount = job.processed_count || 0;
    const batchSize = job.batch_size || 25;

    // Get the next batch to process
    const batch = allGames.slice(processedCount, processedCount + batchSize);

    if (batch.length === 0) {
      // No more games to process - mark as complete
      await supabase
        .from('steam_sync_jobs')
        .update({
          status: 'completed',
          message: 'Ο συγχρονισμός ολοκληρώθηκε επιτυχώς',
          percent: 100,
          finished_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      return NextResponse.json({
        processed: processedCount,
        totalGames: allGames.length,
        isComplete: true,
        percent: 100,
        message: 'Ο συγχρονισμός ολοκληρώθηκε επιτυχώς',
      } satisfies ProcessResult);
    }

    console.log(
      `📦 [Steam Sync Process] Processing ${batch.length} games (${processedCount + 1}-${processedCount + batch.length} of ${allGames.length})`,
    );

    // Update job status
    await supabase
      .from('steam_sync_jobs')
      .update({
        message: `Επεξεργασία παιχνιδιών ${processedCount + 1}-${processedCount + batch.length} από ${allGames.length}...`,
      })
      .eq('id', jobId);

    // Match with RAWG
    const rawgMatchByAppId = await matchSteamGamesToRawg(batch);

    // Fetch existing media items (needed for enrichment filtering)
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

    // Filter matches: skip enrichment for items that already have RAWG metadata
    const rawgMatchesNeedingEnrichment = new Map<number, RawgGame | null>();
    const rawgMatchesAlreadyEnriched = new Map<number, RawgGame | null>();

    for (const [appid, rawgMatch] of rawgMatchByAppId.entries()) {
      if (!rawgMatch) {
        rawgMatchesNeedingEnrichment.set(appid, null);
        continue;
      }

      const existingMedia = mediaByAppId.get(appid);
      const alreadyEnriched =
        existingMedia && existingMedia.rawg_id === rawgMatch.id && existingMedia.source === 'rawg';

      if (alreadyEnriched) {
        rawgMatchesAlreadyEnriched.set(appid, rawgMatch);
      } else {
        rawgMatchesNeedingEnrichment.set(appid, rawgMatch);
      }
    }

    // Enrich RAWG matches
    const enrichedRawgByAppId = await enrichRawgMatches(rawgMatchesNeedingEnrichment);

    // Merge already-enriched items back in
    for (const [appid, match] of rawgMatchesAlreadyEnriched.entries()) {
      enrichedRawgByAppId.set(appid, match);
    }

    // Fetch all matched RAWG IDs to check for existing media
    const allMatchedRawgIds = Array.from(
      new Set(
        batch
          .map(game => enrichedRawgByAppId.get(game.appid)?.id)
          .filter((id): id is number => typeof id === 'number'),
      ),
    );

    const existingRawgMediaByRawgId = new Map<number, { id: number; rawg_id: number | null }>();
    if (allMatchedRawgIds.length > 0) {
      const { data: rawgRows } = await adminSupabase
        .from('media_items')
        .select('id,rawg_id')
        .eq('category', 'games')
        .in('rawg_id', allMatchedRawgIds);

      for (const row of rawgRows ?? []) {
        if (typeof row.rawg_id === 'number') {
          existingRawgMediaByRawgId.set(row.rawg_id, row);
        }
      }
    }

    // Prepare media updates and inserts
    const mediaIdByAppId = new Map<number, number>();
    const insertTasks: Array<{
      appid: number;
      payload: Database['public']['Tables']['media_items']['Insert'];
    }> = [];
    const updateByMediaId = new Map<
      number,
      Database['public']['Tables']['media_items']['Update']
    >();

    for (const game of batch) {
      const matchedRawg = enrichedRawgByAppId.get(game.appid) ?? null;
      const existingByAppId = mediaByAppId.get(game.appid);

      if (existingByAppId) {
        mediaIdByAppId.set(game.appid, existingByAppId.id);

        // Check if already RAWG-enriched
        const isAlreadyEnriched = existingByAppId.source === 'rawg' && existingByAppId.rawg_id;

        if (isAlreadyEnriched) {
          // Preserve existing RAWG data
          updateByMediaId.set(existingByAppId.id, {
            steam_app_id: game.appid,
            runtime: getSteamHours(game),
          });
        } else if (matchedRawg) {
          // New RAWG enrichment
          updateByMediaId.set(existingByAppId.id, buildGameMetadataPatch(game, matchedRawg));
        } else {
          // No RAWG match, just update Steam fields
          updateByMediaId.set(existingByAppId.id, {
            steam_app_id: game.appid,
            runtime: getSteamHours(game),
          });
        }
        continue;
      }

      if (matchedRawg) {
        const existingRawgMedia = existingRawgMediaByRawgId.get(matchedRawg.id);
        if (existingRawgMedia) {
          mediaIdByAppId.set(game.appid, existingRawgMedia.id);
          updateByMediaId.set(existingRawgMedia.id, {
            steam_app_id: game.appid,
            runtime: getSteamHours(game),
          });
          continue;
        }

        insertTasks.push({
          appid: game.appid,
          payload: {
            category: 'games',
            ...buildGameMetadataPatch(game, matchedRawg),
          },
        });
      } else {
        insertTasks.push({
          appid: game.appid,
          payload: buildSteamFallbackInsert(game),
        });
      }
    }

    // Execute media inserts
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
        // Fallback to individual inserts
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

    // Execute media updates
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

    // Handle user entries
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

    // Get user's existing game titles for dedup
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
      if (normalizedTitle) userTitleSet.add(normalizedTitle);
      if (normalizedEnglishTitle) userTitleSet.add(normalizedEnglishTitle);
    }

    // Prepare user entry payloads
    const userEntryPayload: Database['public']['Tables']['user_media_entries']['Insert'][] = [];
    const userEntryUpdates: Database['public']['Tables']['user_media_entries']['Insert'][] = [];

    for (const game of batch) {
      const mediaId = mediaIdByAppId.get(game.appid);
      if (!mediaId) continue;

      const existingEntry = existingEntryByMediaId.get(mediaId);
      const derivedStatus = deriveStatusFromSteamData({
        playtimeMinutes: game.playtime_forever,
        lastPlayedUnix: game.rtime_last_played,
        achievementsPercent: game.achievementsPercent,
      });

      if (existingEntry !== undefined) {
        // Only update if import_source='steam'
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

      // Check for potential duplicates
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

    // Upsert user entries
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

    // Update job progress
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
          ? 'Ο συγχρονισμός ολοκληρώθηκε επιτυχώς'
          : `Επεξεργάστηκαν ${newProcessedCount} από ${allGames.length} παιχνίδια`,
        ...(isComplete && {
          status: 'completed',
          finished_at: new Date().toISOString(),
        }),
      })
      .eq('id', jobId);

    console.log(
      `✅ [Steam Sync Process] Batch complete: ${newProcessedCount}/${allGames.length} (${newPercent}%)`,
    );

    return NextResponse.json({
      processed: newProcessedCount,
      totalGames: allGames.length,
      isComplete,
      percent: newPercent,
      message: isComplete
        ? 'Ο συγχρονισμός ολοκληρώθηκε επιτυχώς'
        : `Επεξεργάστηκαν ${newProcessedCount} από ${allGames.length} παιχνίδια`,
    } satisfies ProcessResult);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : 'Failed to process batch';
    console.error('❌ [Steam Sync Process] Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withApiRoute(POSTHandler);

// Each batch should complete in < 10 seconds (25 games with RAWG matching/enrichment)
export const maxDuration = 10;
