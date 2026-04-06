import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import type { Database } from '@/lib/supabase/database.types';
import { type IgdbGame } from '@/lib/services/igdbService';
import {
  fetchSteamOwnedGames,
  fetchSteamAchievements,
  getSteamApiKey,
  resolveSteamId64,
} from '@/lib/integrations/steam';
import {
  type SyncProgress,
  type SyncResult,
  SyncAlreadyRunningError,
  extractErrorMessage,
  normalizeTitle,
  getSteamHours,
  deriveStatusFromSteamData,
  buildDebugSample,
  buildBacklogRedirect,
  buildGameMetadataPatch,
  mapWithConcurrency,
} from './helpers';
import { getUserSteamInput, createSyncJob, getRunningSyncJob, updateSyncJob } from './jobs';
import { matchSteamGamesToIgdb, enrichIgdbMatches } from './igdbMatching';
import { recomputeCategoryProfiles } from '@/lib/profile/recompute-category-profiles';

async function syncSteamForUser(options?: {
  includeDebug?: boolean;
  jobId?: string;
  onProgress?: (progress: SyncProgress) => Promise<void> | void;
}): Promise<SyncResult> {
  console.warn('[Steam Sync] Starting sync...', { jobId: options?.jobId });

  const supabase = await createRouteHandlerClient();
  const adminSupabase = createSupabaseAdminClient();
  const session = await requireAuth(supabase);

  let completedSteps = 0;
  let totalSteps = 1;
  const updateProgress = async (message: string, stepDelta = 0) => {
    completedSteps += stepDelta;
    /* c8 ignore next 2 -- totalSteps starts at 1, the :0 branch is unreachable */
    const percent =
      totalSteps > 0 ? Math.min(100, Math.round((completedSteps / totalSteps) * 100)) : 0;

    console.warn(
      `[Steam Sync] Progress: ${percent}% - ${message} (${completedSteps}/${totalSteps})`,
    );

    if (options?.jobId) {
      await updateSyncJob(options.jobId, {
        message,
        completedSteps,
        totalSteps,
        percent,
      });
    }

    /* istanbul ignore next -- onProgress is not passed from route handlers */
    await options?.onProgress?.({ message, completedSteps, totalSteps, percent });
  };

  await updateProgress('Connecting to Steam profile...');

  const steamInput = await getUserSteamInput(supabase, session.user.id);
  if (!steamInput) {
    console.error('[Steam Sync] No steam_id in user profile');
    throw new Error('No Steam ID is set in your profile. Go to settings to add it.');
  }

  console.warn('[Steam Sync] Fetching Steam API key...');
  const apiKey = getSteamApiKey();

  console.warn('[Steam Sync] Resolving Steam ID64...');
  const steamId64 = await resolveSteamId64({ apiKey, steamInput });

  console.warn('[Steam Sync] Fetching owned games...');
  const steamGames = await fetchSteamOwnedGames({ apiKey, steamId64 });

  const uniqueGames = Array.from(
    new Map(steamGames.map(game => [game.appid, game] as const)).values(),
  ).filter(game => typeof game.appid === 'number' && game.appid > 0 && game.name);

  totalSteps = Math.max(12, uniqueGames.length * 4 + 8);
  await updateProgress(`Found ${uniqueGames.length} games from Steam.`, 1);

  if (uniqueGames.length === 0) {
    return {
      totalFetched: 0,
      mediaInserted: 0,
      mediaUpdated: 0,
      mediaInsertFailed: 0,
      mediaUpdateFailed: 0,
      entriesInserted: 0,
      entriesUpdated: 0,
      entriesUpsertFailed: 0,
      entriesSkippedExisting: 0,
      entriesSkippedPotentialDuplicate: 0,
      ...(options?.includeDebug
        ? {
            debug: {
              steamId64,
              sample: [],
            },
          }
        : {}),
    };
  }

  await updateProgress('Fetching achievements...', 1);
  const achievementsPercentByAppId = new Map<number, number>();
  const gamesWithStats = uniqueGames.filter(g => g.has_community_visible_stats);

  if (gamesWithStats.length > 0) {
    totalSteps += gamesWithStats.length;
    await mapWithConcurrency(
      gamesWithStats,
      2,
      async game => {
        const result = await fetchSteamAchievements({ apiKey, steamId64, appid: game.appid });
        if (result && result.percent > 0) {
          achievementsPercentByAppId.set(game.appid, result.percent);
        }
        return result;
      },
      async (done, total) => {
        await updateProgress(`Achievements ${done}/${total}`, 1);
      },
    );
  }

  await updateProgress('Matching Steam titles with IGDB...', 1);
  const igdbMatchByAppId = await matchSteamGamesToIgdb(
    uniqueGames,
    /* c8 ignore next 3 */
    async (done, total) => {
      await updateProgress(`IGDB matching ${done}/${total}`, 1);
    },
  );

  const appIds = uniqueGames.map(game => game.appid);
  const { data: existingMediaRows, error: existingMediaError } = await adminSupabase
    .from('media_items')
    .select('id,steam_app_id,rawg_id,source')
    .eq('category', 'games')
    .in('steam_app_id', appIds);

  if (existingMediaError) {
    throw existingMediaError;
  }

  const mediaByAppId = new Map<
    number,
    { id: number; steam_app_id: number | null; rawg_id: number | null; source: string | null }
  >();
  for (const row of existingMediaRows ?? []) {
    if (typeof row.steam_app_id === 'number') {
      mediaByAppId.set(row.steam_app_id, row);
    }
  }

  await updateProgress('Fetching IGDB metadata...', 0);

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

  const needsEnrichmentCount = Array.from(igdbMatchesNeedingEnrichment.values()).filter(
    Boolean,
  ).length;
  totalSteps += needsEnrichmentCount;

  const enrichedIgdbByAppId = await enrichIgdbMatches(
    igdbMatchesNeedingEnrichment,
    /* c8 ignore next 3 */
    async (done, total) => {
      await updateProgress(`IGDB metadata ${done}/${total}`, 1);
    },
  );

  for (const [appid, match] of igdbMatchesAlreadyEnriched.entries()) {
    enrichedIgdbByAppId.set(appid, match);
  }

  const allMatchedIgdbIds = Array.from(
    new Set(
      uniqueGames
        .map(game => enrichedIgdbByAppId.get(game.appid)?.id)
        .filter((id): id is number => typeof id === 'number'),
    ),
  );
  const existingIgdbMediaByIgdbId = new Map<number, { id: number; rawg_id: number | null }>();
  if (allMatchedIgdbIds.length > 0) {
    const { data: igdbRows, error: igdbRowsError } = await adminSupabase
      .from('media_items')
      .select('id,rawg_id')
      .eq('category', 'games')
      .in('rawg_id', allMatchedIgdbIds);

    if (igdbRowsError) {
      throw igdbRowsError;
    }

    for (const row of igdbRows ?? []) {
      if (typeof row.rawg_id === 'number') {
        existingIgdbMediaByIgdbId.set(row.rawg_id, row);
      }
    }
  }

  // Build a map of existing games by normalized title to catch duplicates
  const { data: allGamesRows, error: allGamesError } = await adminSupabase
    .from('media_items')
    .select('id,title,title_english,steam_app_id,rawg_id,source')
    .eq('category', 'games');

  if (allGamesError) {
    throw allGamesError;
  }

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
  const updateByMediaId = new Map<number, Database['public']['Tables']['media_items']['Update']>();
  const rejectedGames: Array<{ appid: number; name: string; reason: string }> = [];

  await updateProgress('Syncing catalog media...', 1);
  for (const game of uniqueGames) {
    const matchedIgdb = enrichedIgdbByAppId.get(game.appid) ?? null;
    const existingByAppId = mediaByAppId.get(game.appid);

    if (existingByAppId) {
      mediaIdByAppId.set(game.appid, existingByAppId.id);

      const isAlreadyEnriched = existingByAppId.source === 'igdb' && existingByAppId.rawg_id;

      if (isAlreadyEnriched) {
        console.warn(
          `[Steam Sync] Preserving IGDB data for: ${game.name} (IGDB ID: ${existingByAppId.rawg_id})`,
        );
        updateByMediaId.set(existingByAppId.id, {
          steam_app_id: game.appid,
          runtime: getSteamHours(game),
        });
      } else if (matchedIgdb) {
        console.warn(`[Steam Sync] Enriching with IGDB: ${game.name} (IGDB ID: ${matchedIgdb.id})`);
        updateByMediaId.set(existingByAppId.id, buildGameMetadataPatch(game, matchedIgdb));
      } else {
        // Keep existing entry but don't enrich it
        updateByMediaId.set(existingByAppId.id, {
          steam_app_id: game.appid,
          runtime: getSteamHours(game),
        });
      }
      await updateProgress(`Catalog sync ${mediaIdByAppId.size}/${uniqueGames.length}`, 1);
      continue;
    }

    if (matchedIgdb) {
      const existingIgdbMedia = existingIgdbMediaByIgdbId.get(matchedIgdb.id);
      if (existingIgdbMedia) {
        mediaIdByAppId.set(game.appid, existingIgdbMedia.id);
        console.warn(
          `[Steam Sync] Preserving existing IGDB media: ${game.name} (IGDB ID: ${matchedIgdb.id})`,
        );
        updateByMediaId.set(existingIgdbMedia.id, {
          steam_app_id: game.appid,
          runtime: getSteamHours(game),
        });
        await updateProgress(`Catalog sync ${mediaIdByAppId.size}/${uniqueGames.length}`, 1);
        continue;
      }

      // Check for duplicates by normalized title
      const normalizedGameTitle = normalizeTitle(game.name);
      // game.name is always set (filtered above) and normalizeTitle returns non-empty for valid names
      const existingByTitle = normalizedGameTitle
        ? existingMediaByNormalizedTitle.get(normalizedGameTitle)
        : /* c8 ignore next */
          null;

      if (existingByTitle) {
        mediaIdByAppId.set(game.appid, existingByTitle.id);
        console.warn(
          `[Steam Sync] Found duplicate by title: ${game.name} - Updating existing media ID ${existingByTitle.id} instead of inserting`,
        );
        // Update the existing media item with IGDB data + steam_app_id
        updateByMediaId.set(existingByTitle.id, buildGameMetadataPatch(game, matchedIgdb));
        await updateProgress(`Catalog sync ${mediaIdByAppId.size}/${uniqueGames.length}`, 1);
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
      // Reject games without IGDB match - don't insert them
      console.warn(
        `[Steam Sync] Rejecting: ${game.name} (Steam App ${game.appid}) - No IGDB match`,
      );
      rejectedGames.push({
        appid: game.appid,
        name: game.name ?? `Steam App ${game.appid}`,
        reason: 'Not found in IGDB database',
      });
    }

    await updateProgress(
      `Catalog sync ${mediaIdByAppId.size + insertTasks.length}/${uniqueGames.length}`,
      1,
    );
  }

  let insertedMediaCount = 0;
  let failedMediaInsertCount = 0;
  if (insertTasks.length > 0) {
    const { data: insertedMediaRows, error: mediaInsertError } = await adminSupabase
      .from('media_items')
      .insert(insertTasks.map(item => item.payload))
      .select('id,steam_app_id');

    if (!mediaInsertError) {
      insertedMediaCount = insertedMediaRows?.length ?? 0;
      for (const row of insertedMediaRows ?? []) {
        if (typeof row.steam_app_id === 'number') {
          mediaIdByAppId.set(row.steam_app_id, row.id);
        }
      }
    } else {
      await mapWithConcurrency(insertTasks, 4, async task => {
        const { data, error } = await adminSupabase
          .from('media_items')
          .insert(task.payload)
          .select('id,steam_app_id')
          .single();

        if (error) {
          failedMediaInsertCount += 1;
          return null;
        }
        insertedMediaCount += 1;
        if (typeof data.steam_app_id === 'number') {
          mediaIdByAppId.set(data.steam_app_id, data.id);
        }
        return data;
      });
    }
  }

  let failedMediaUpdateCount = 0;
  if (updateByMediaId.size > 0) {
    await mapWithConcurrency(
      Array.from(updateByMediaId.entries()),
      8,
      async ([mediaId, updatePayload]) => {
        const { error } = await adminSupabase
          .from('media_items')
          .update(updatePayload)
          .eq('id', mediaId);

        if (error) {
          console.error(`Media update failed for ID ${mediaId}:`, error);
          console.error(`   Payload:`, JSON.stringify(updatePayload, null, 2));
          failedMediaUpdateCount += 1;
          return false;
        }
        return true;
      },
      async (done, total) => {
        await updateProgress(`IGDB enrichment ${done}/${total}`, 1);
      },
    );
  }

  const mediaIds = Array.from(mediaIdByAppId.values());
  const { data: existingEntryRows, error: existingEntriesError } = await supabase
    .from('user_media_entries')
    .select('media_id,import_source,status,updated_at')
    .eq('user_id', session.user.id)
    .in('media_id', mediaIds);

  if (existingEntriesError) {
    throw existingEntriesError;
  }

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

  const { data: userGameRows, error: userGameRowsError } = await supabase
    .from('user_media_entries')
    .select('media_items!inner(title,title_english,category)')
    .eq('user_id', session.user.id)
    .eq('media_items.category', 'games');

  if (userGameRowsError) {
    throw userGameRowsError;
  }

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
  let skippedPotentialDuplicate = 0;

  await updateProgress('Syncing user entries...', 1);
  for (const game of uniqueGames) {
    const mediaId = mediaIdByAppId.get(game.appid);
    if (!mediaId) {
      continue;
    }

    const existingEntry = existingEntryByMediaId.get(mediaId);
    const achievementsPercent = achievementsPercentByAppId.get(game.appid);
    const derivedStatus = deriveStatusFromSteamData({
      playtimeMinutes: game.playtime_forever,
      lastPlayedUnix: game.rtime_last_played,
      achievementsPercent,
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
      await updateProgress(
        `Entries ${userEntryPayload.length + userEntryUpdates.length}/${uniqueGames.length}`,
        1,
      );
      continue;
    }

    const normalizedSteamTitle = normalizeTitle(game.name);
    if (normalizedSteamTitle && userTitleSet.has(normalizedSteamTitle)) {
      skippedPotentialDuplicate += 1;
      await updateProgress(
        `Entries ${userEntryPayload.length + userEntryUpdates.length}/${uniqueGames.length}`,
        1,
      );
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
    await updateProgress(
      `Entries ${userEntryPayload.length + userEntryUpdates.length}/${uniqueGames.length}`,
      1,
    );
  }

  let failedEntryUpsertCount = 0;
  if (userEntryPayload.length > 0) {
    const { error: entryInsertError } = await supabase
      .from('user_media_entries')
      .upsert(userEntryPayload, { onConflict: 'user_id,media_id' });
    if (entryInsertError) {
      failedEntryUpsertCount += userEntryPayload.length;
    }
  }

  if (userEntryUpdates.length > 0) {
    const { error: entryUpdateError } = await supabase
      .from('user_media_entries')
      .upsert(userEntryUpdates, { onConflict: 'user_id,media_id' });
    if (entryUpdateError) {
      failedEntryUpsertCount += userEntryUpdates.length;
    }
  }

  if (userEntryPayload.length > 0 || userEntryUpdates.length > 0) {
    void recomputeCategoryProfiles(supabase, session.user.id, ['games']).catch(error => {
      console.warn('[Steam Sync] Derived profile recompute failed:', error);
    });
  }

  await updateProgress('Finalizing sync...', totalSteps - completedSteps);

  const warnings: string[] = [];
  if (failedMediaInsertCount > 0) {
    warnings.push(`Failed media inserts: ${failedMediaInsertCount}`);
  }
  if (failedMediaUpdateCount > 0) {
    warnings.push(`Failed media updates: ${failedMediaUpdateCount}`);
  }
  if (failedEntryUpsertCount > 0) {
    warnings.push(`Failed entry inserts/updates: ${failedEntryUpsertCount}`);
  }

  const result: SyncResult = {
    totalFetched: uniqueGames.length,
    mediaInserted: insertedMediaCount,
    mediaUpdated: updateByMediaId.size,
    mediaInsertFailed: failedMediaInsertCount,
    mediaUpdateFailed: failedMediaUpdateCount,
    entriesInserted: userEntryPayload.length,
    entriesUpdated: userEntryUpdates.length,
    entriesUpsertFailed: failedEntryUpsertCount,
    entriesSkippedExisting: Math.max(0, existingEntryByMediaId.size - userEntryUpdates.length),
    entriesSkippedPotentialDuplicate: skippedPotentialDuplicate,
    rejectedGames: rejectedGames.length > 0 ? rejectedGames : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };

  if (options?.includeDebug) {
    result.debug = {
      steamId64,
      sample: buildDebugSample(uniqueGames, achievementsPercentByAppId),
    };
  }

  return result;
}

async function POSTHandler(req: Request) {
  let jobId: string | null = null;

  try {
    const url = new URL(req.url);
    const includeDebug = url.searchParams.get('debug') === '1';

    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const runningJob = await getRunningSyncJob(session.user.id);
    if (runningJob) {
      return NextResponse.json(
        { error: 'A sync is already in progress.', jobId: runningJob.id },
        { status: 409 },
      );
    }
    jobId = await createSyncJob(session.user.id);

    const result = await syncSteamForUser({ includeDebug, jobId });

    await updateSyncJob(jobId, {
      status: 'completed',
      message: 'Steam sync completed successfully',
      percent: 100,
      result,
      finishedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ...result, jobId });
  } catch (error) {
    if (error instanceof SyncAlreadyRunningError) {
      return NextResponse.json(
        { error: 'A sync is already in progress.', jobId: error.jobId },
        { status: 409 },
      );
    }

    if (jobId) {
      const errorMessage = extractErrorMessage(error, 'Unknown error');
      await updateSyncJob(jobId, {
        status: 'failed',
        message: 'Steam sync failed',
        error: errorMessage,
        finishedAt: new Date().toISOString(),
      }).catch(console.error);
    }

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const message = extractErrorMessage(error, 'Steam library sync failed');
    console.error('Steam sync error:', error);
    return NextResponse.json({ error: message, jobId }, { status: 500 });
  }
}

async function GETHandler(req: Request) {
  let jobId: string | null = null;

  try {
    const { searchParams } = new URL(req.url);
    const shouldRedirect = searchParams.get('redirect') === '1';
    const includeDebug = searchParams.get('debug') === '1';

    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const runningJob = await getRunningSyncJob(session.user.id);
    if (runningJob) {
      return NextResponse.json(
        { error: 'A sync is already in progress.', jobId: runningJob.id },
        { status: 409 },
      );
    }
    jobId = await createSyncJob(session.user.id);

    const result = await syncSteamForUser({ includeDebug, jobId });

    await updateSyncJob(jobId, {
      status: 'completed',
      message: 'Steam sync completed successfully',
      percent: 100,
      result,
      finishedAt: new Date().toISOString(),
    });

    if (!shouldRedirect) {
      return NextResponse.json({ ...result, jobId });
    }

    return NextResponse.redirect(buildBacklogRedirect(req.url, 'success').toString());
  } catch (error) {
    if (error instanceof SyncAlreadyRunningError) {
      return NextResponse.json(
        { error: 'A sync is already in progress.', jobId: error.jobId },
        { status: 409 },
      );
    }

    if (jobId) {
      const errorMessage = extractErrorMessage(error, 'Unknown error');
      await updateSyncJob(jobId, {
        status: 'failed',
        message: 'Steam sync failed',
        error: errorMessage,
        finishedAt: new Date().toISOString(),
      }).catch(console.error);
    }

    if (error instanceof UnauthorizedError) {
      return NextResponse.redirect(
        buildBacklogRedirect(req.url, 'error', 'unauthorized').toString(),
      );
    }

    const message = extractErrorMessage(error, 'steam_sync_failed');
    console.error('Steam sync error:', error);
    return NextResponse.redirect(
      buildBacklogRedirect(req.url, 'error', message.slice(0, 120)).toString(),
    );
  }
}

export const POST = withApiRoute(POSTHandler);
export const GET = withApiRoute(GETHandler);
