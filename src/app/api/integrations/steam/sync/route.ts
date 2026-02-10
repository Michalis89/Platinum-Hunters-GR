import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import type { Database } from '@/lib/supabase/database.types';
import {
  searchRawgGames,
  fetchRawgGameDetails,
  type RawgGame,
} from '@/lib/services/rawgService';
import {
  fetchSteamOwnedGames,
  getSteamApiKey,
  getSteamCoverUrls,
  resolveSteamId64,
  type SteamOwnedGame,
} from '@/lib/integrations/steam';

type SyncProgress = {
  message: string;
  completedSteps: number;
  totalSteps: number;
};

type SyncResult = {
  totalFetched: number;
  mediaInserted: number;
  mediaUpdated: number;
  mediaInsertFailed: number;
  mediaUpdateFailed: number;
  entriesInserted: number;
  entriesUpdated: number;
  entriesUpsertFailed: number;
  entriesSkippedExisting: number;
  entriesSkippedPotentialDuplicate: number;
  warnings?: string[];
  debug?: {
    steamId64: string;
    sample: Array<{
      appid: number;
      name?: string;
      playtime_forever?: number;
      playtime_2weeks?: number;
      rtime_last_played?: number;
      has_community_visible_stats?: boolean;
      mappedStatus: 'planned' | 'current';
    }>;
  };
};


function normalizeTitle(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

function normalizeForMatch(value?: string | null): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();
}

function mapStatusFromPlaytime(playtimeMinutes?: number): 'planned' | 'current' {
  return typeof playtimeMinutes === 'number' && playtimeMinutes > 0 ? 'current' : 'planned';
}

function buildDebugSample(games: SteamOwnedGame[]) {
  return games.slice(0, 20).map(game => {
    return {
      appid: game.appid,
      name: game.name,
      playtime_forever: game.playtime_forever,
      playtime_2weeks: game.playtime_2weeks,
      rtime_last_played: game.rtime_last_played,
      has_community_visible_stats: game.has_community_visible_stats,
      mappedStatus: mapStatusFromPlaytime(game.playtime_forever),
    };
  });
}

async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  limit: number,
  mapper: (item: TInput, index: number) => Promise<TOutput>,
  onItemComplete?: (completed: number, total: number) => Promise<void> | void,
): Promise<TOutput[]> {
  const safeLimit = Math.max(1, limit);
  const results: TOutput[] = new Array(items.length);
  let readIndex = 0;
  let completed = 0;

  const worker = async () => {
    while (readIndex < items.length) {
      const current = readIndex++;
      results[current] = await mapper(items[current], current);
      completed += 1;
      await onItemComplete?.(completed, items.length);
    }
  };

  await Promise.all(Array.from({ length: Math.min(safeLimit, items.length) }, () => worker()));
  return results;
}

async function matchSteamGamesToRawg(
  games: SteamOwnedGame[],
  onItemComplete?: (completed: number, total: number) => Promise<void> | void,
) {
  const cache = new Map<string, RawgGame | null>();

  const pairs = await mapWithConcurrency(
    games,
    3,
    async game => {
      const title = game.name ?? '';
      const key = normalizeForMatch(title);
      if (!key) {
        return [game.appid, null] as const;
      }

      if (cache.has(key)) {
        return [game.appid, cache.get(key) ?? null] as const;
      }

      try {
        const candidates = await searchRawgGames(title, 8);
        const matched = candidates.find(candidate => normalizeForMatch(candidate.name) === key) ?? null;

        cache.set(key, matched);
        return [game.appid, matched] as const;
      } catch (error) {
        console.warn(`RAWG search failed for "${title}":`, error);
        cache.set(key, null);
        return [game.appid, null] as const;
      }
    },
    onItemComplete,
  );

  return new Map<number, RawgGame | null>(pairs);
}

async function enrichRawgMatches(
  matchByAppId: Map<number, RawgGame | null>,
  onItemComplete?: (completed: number, total: number) => Promise<void> | void,
) {
  const matchedRawgIds = Array.from(
    new Set(
      Array.from(matchByAppId.values())
        .map(item => item?.id)
        .filter((id): id is number => typeof id === 'number'),
    ),
  );
  const detailsCache = new Map<number, RawgGame | null>();

  if (matchedRawgIds.length === 0) {
    return new Map<number, RawgGame | null>();
  }

  await mapWithConcurrency(
    matchedRawgIds,
    3,
    async rawgId => {
      try {
        const details = await fetchRawgGameDetails(rawgId);
        detailsCache.set(rawgId, details);
        return details;
      } catch (error) {
        console.warn(`RAWG details fetch failed for ID ${rawgId}:`, error);
        detailsCache.set(rawgId, null);
        return null;
      }
    },
    onItemComplete,
  );

  const enrichedByAppId = new Map<number, RawgGame | null>();
  for (const [appid, matched] of matchByAppId.entries()) {
    if (!matched) {
      enrichedByAppId.set(appid, null);
      continue;
    }
    enrichedByAppId.set(appid, detailsCache.get(matched.id) ?? matched);
  }

  return enrichedByAppId;
}

function mergePlatforms(rawgPlatforms: string[] | null | undefined): string[] {
  const ordered = ['PC', ...(rawgPlatforms ?? [])].filter(Boolean);
  return Array.from(new Set(ordered));
}

function getSteamHours(game: SteamOwnedGame): number | null {
  if (typeof game.playtime_forever !== 'number') {
    return null;
  }
  return Math.max(0, Math.floor(game.playtime_forever / 60));
}

function buildGameMetadataPatch(game: SteamOwnedGame, rawg: RawgGame) {
  const rawgPlatforms = rawg.platforms?.map(item => item.platform.name) ?? [];
  const rawgGenres = rawg.genres?.map(item => item.name) ?? [];
  const year = rawg.released ? Number.parseInt(rawg.released.slice(0, 4), 10) : null;

  return {
    source: 'rawg',
    rawg_id: rawg.id,
    steam_app_id: game.appid,
    title: rawg.name ?? game.name ?? `Steam App ${game.appid}`,
    title_english: rawg.name ?? game.name ?? `Steam App ${game.appid}`,
    description: rawg.description_raw ?? null,
    cover_image_large: rawg.background_image ?? getSteamCoverUrls(game).large,
    cover_image_medium: rawg.background_image ?? getSteamCoverUrls(game).medium,
    season_year: Number.isFinite(year) ? year : null,
    release_date: rawg.released ?? null,
    rating: rawg.rating ?? null,
    metacritic: rawg.metacritic ?? null,
    platforms: mergePlatforms(rawgPlatforms),
    genres: rawgGenres,
    developer: rawg.developers?.[0]?.name ?? null,
    publisher: rawg.publishers?.[0]?.name ?? null,
    esrb_rating: rawg.esrb_rating?.name ?? null,
    runtime: rawg.playtime ?? null,
  } satisfies Database['public']['Tables']['media_items']['Update'];
}

function buildSteamFallbackInsert(game: SteamOwnedGame) {
  const covers = getSteamCoverUrls(game);
  return {
    category: 'games',
    source: 'steam',
    steam_app_id: game.appid,
    title: game.name ?? `Steam App ${game.appid}`,
    title_english: game.name ?? `Steam App ${game.appid}`,
    cover_image_large: covers.large,
    cover_image_medium: covers.medium,
    platforms: ['PC'],
  } satisfies Database['public']['Tables']['media_items']['Insert'];
}

function buildBacklogRedirect(requestUrl: string, status: 'success' | 'error', reason?: string) {
  const redirectUrl = new URL('/pages/backlog?category=games', requestUrl);
  redirectUrl.searchParams.set('steam', status);
  if (reason) {
    redirectUrl.searchParams.set('steam_reason', reason);
  }
  return redirectUrl;
}

async function syncSteamForUser(options?: {
  includeDebug?: boolean;
  onProgress?: (progress: SyncProgress) => Promise<void> | void;
}): Promise<SyncResult> {
  const supabase = await createRouteHandlerClient();
  const adminSupabase = createSupabaseAdminClient();
  const session = await requireAuth(supabase);

  let completedSteps = 0;
  let totalSteps = 1;
  const updateProgress = async (message: string, stepDelta = 0) => {
    completedSteps += stepDelta;
    await options?.onProgress?.({
      message,
      completedSteps,
      totalSteps,
    });
  };

  await updateProgress('Σύνδεση με Steam προφίλ...');

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('steam_id')
    .eq('id', session.user.id)
    .maybeSingle();

  if (userError) {
    throw userError;
  }

  const steamInput = userData?.steam_id?.trim();
  if (!steamInput) {
    throw new Error('Missing steam_id in user profile');
  }

  const apiKey = getSteamApiKey();
  const steamId64 = await resolveSteamId64({ apiKey, steamInput });
  const steamGames = await fetchSteamOwnedGames({ apiKey, steamId64 });

  const uniqueGames = Array.from(
    new Map(steamGames.map(game => [game.appid, game] as const)).values(),
  ).filter(game => typeof game.appid === 'number' && game.appid > 0 && game.name);

  totalSteps = Math.max(12, uniqueGames.length * 4 + 8);
  await updateProgress(`Βρέθηκαν ${uniqueGames.length} παιχνίδια από Steam.`, 1);

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

  await updateProgress('Αντιστοίχιση τίτλων Steam με RAWG...', 1);
  const rawgMatchByAppId = await matchSteamGamesToRawg(uniqueGames, async (done, total) => {
    await updateProgress(`Αντιστοίχιση RAWG ${done}/${total}`, 1);
  });

  const matchedRawgCount = Array.from(rawgMatchByAppId.values()).filter(Boolean).length;
  totalSteps += matchedRawgCount;
  await updateProgress('Ανάκτηση RAWG metadata...', 0);

  const enrichedRawgByAppId = await enrichRawgMatches(rawgMatchByAppId, async (done, total) => {
    await updateProgress(`RAWG metadata ${done}/${total}`, 1);
  });

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

  const allMatchedRawgIds = Array.from(
    new Set(
      uniqueGames
        .map(game => enrichedRawgByAppId.get(game.appid)?.id)
        .filter((id): id is number => typeof id === 'number'),
    ),
  );
  const existingRawgMediaByRawgId = new Map<number, { id: number; rawg_id: number | null }>();
  if (allMatchedRawgIds.length > 0) {
    const { data: rawgRows, error: rawgRowsError } = await adminSupabase
      .from('media_items')
      .select('id,rawg_id')
      .eq('category', 'games')
      .in('rawg_id', allMatchedRawgIds);

    if (rawgRowsError) {
      throw rawgRowsError;
    }

    for (const row of rawgRows ?? []) {
      if (typeof row.rawg_id === 'number') {
        existingRawgMediaByRawgId.set(row.rawg_id, row);
      }
    }
  }

  const mediaIdByAppId = new Map<number, number>();
  const insertTasks: Array<{ appid: number; payload: Database['public']['Tables']['media_items']['Insert'] }> = [];
  const updateByMediaId = new Map<number, Database['public']['Tables']['media_items']['Update']>();

  await updateProgress('Συγχρονισμός catalog media...', 1);
  for (const game of uniqueGames) {
    const matchedRawg = enrichedRawgByAppId.get(game.appid) ?? null;
    const existingByAppId = mediaByAppId.get(game.appid);

    if (existingByAppId) {
      mediaIdByAppId.set(game.appid, existingByAppId.id);
      if (matchedRawg) {
        updateByMediaId.set(existingByAppId.id, buildGameMetadataPatch(game, matchedRawg));
      } else {
        updateByMediaId.set(existingByAppId.id, {
          steam_app_id: game.appid,
          runtime: getSteamHours(game),
        });
      }
      await updateProgress(`Catalog ενημέρωση ${mediaIdByAppId.size}/${uniqueGames.length}`, 1);
      continue;
    }

    if (matchedRawg) {
      const existingRawgMedia = existingRawgMediaByRawgId.get(matchedRawg.id);
      if (existingRawgMedia) {
        mediaIdByAppId.set(game.appid, existingRawgMedia.id);
        updateByMediaId.set(existingRawgMedia.id, buildGameMetadataPatch(game, matchedRawg));
        await updateProgress(`Catalog ενημέρωση ${mediaIdByAppId.size}/${uniqueGames.length}`, 1);
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

    await updateProgress(`Catalog ενημέρωση ${mediaIdByAppId.size + insertTasks.length}/${uniqueGames.length}`, 1);
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
          failedMediaUpdateCount += 1;
          return false;
        }
        return true;
      },
      async (done, total) => {
        await updateProgress(`RAWG enrichment ${done}/${total}`, 1);
      },
    );
  }

  const mediaIds = Array.from(mediaIdByAppId.values());
  const { data: existingEntryRows, error: existingEntriesError } = await supabase
    .from('user_media_entries')
    .select('media_id,import_source')
    .eq('user_id', session.user.id)
    .in('media_id', mediaIds);

  if (existingEntriesError) {
    throw existingEntriesError;
  }

  const existingEntryByMediaId = new Map<number, string | null>();
  for (const row of existingEntryRows ?? []) {
    existingEntryByMediaId.set(row.media_id, row.import_source ?? null);
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
    const media = row.media_items as { title?: string | null; title_english?: string | null } | null;
    const normalizedTitle = normalizeTitle(media?.title);
    const normalizedEnglishTitle = normalizeTitle(media?.title_english);
    if (normalizedTitle) userTitleSet.add(normalizedTitle);
    if (normalizedEnglishTitle) userTitleSet.add(normalizedEnglishTitle);
  }

  const userEntryPayload: Database['public']['Tables']['user_media_entries']['Insert'][] = [];
  const userEntryUpdates: Database['public']['Tables']['user_media_entries']['Insert'][] = [];
  let skippedPotentialDuplicate = 0;

  await updateProgress('Συγχρονισμός user entries...', 1);
  for (const game of uniqueGames) {
    const mediaId = mediaIdByAppId.get(game.appid);
    if (!mediaId) {
      continue;
    }

    const existingSource = existingEntryByMediaId.get(mediaId);
    if (existingSource !== undefined) {
      if (existingSource === 'steam') {
        userEntryUpdates.push({
          user_id: session.user.id,
          media_id: mediaId,
          status: mapStatusFromPlaytime(game.playtime_forever),
          progress: getSteamHours(game) ?? 0,
          import_source: 'steam',
          selected_platform: 'PC',
        });
      }
      await updateProgress(`Entries ${userEntryPayload.length + userEntryUpdates.length}/${uniqueGames.length}`, 1);
      continue;
    }

    const normalizedSteamTitle = normalizeTitle(game.name);
    if (normalizedSteamTitle && userTitleSet.has(normalizedSteamTitle)) {
      skippedPotentialDuplicate += 1;
      await updateProgress(`Entries ${userEntryPayload.length + userEntryUpdates.length}/${uniqueGames.length}`, 1);
      continue;
    }

    userEntryPayload.push({
      user_id: session.user.id,
      media_id: mediaId,
      status: mapStatusFromPlaytime(game.playtime_forever),
      progress: getSteamHours(game) ?? 0,
      import_source: 'steam',
      selected_platform: 'PC',
    });

    if (normalizedSteamTitle) {
      userTitleSet.add(normalizedSteamTitle);
    }
    await updateProgress(`Entries ${userEntryPayload.length + userEntryUpdates.length}/${uniqueGames.length}`, 1);
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

  await updateProgress('Ολοκλήρωση συγχρονισμού...', totalSteps - completedSteps);

  const warnings: string[] = [];
  if (failedMediaInsertCount > 0) warnings.push(`Αποτυχημένες εισαγωγές media: ${failedMediaInsertCount}`);
  if (failedMediaUpdateCount > 0) warnings.push(`Αποτυχημένα updates media: ${failedMediaUpdateCount}`);
  if (failedEntryUpsertCount > 0)
    warnings.push(`Αποτυχημένα inserts/updates entries: ${failedEntryUpsertCount}`);

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
    warnings: warnings.length > 0 ? warnings : undefined,
  };

  if (options?.includeDebug) {
    result.debug = {
      steamId64,
      sample: buildDebugSample(uniqueGames),
    };
  }

  return result;
}

async function POSTHandler(req: Request) {
  try {
    const url = new URL(req.url);
    const includeDebug = url.searchParams.get('debug') === '1';

    const result = await syncSteamForUser({ includeDebug });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const message =
      error instanceof Error ? error.message : 'Αποτυχία συγχρονισμού βιβλιοθήκης Steam';
    console.error('Steam sync error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function GETHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shouldRedirect = searchParams.get('redirect') === '1';
    const includeDebug = searchParams.get('debug') === '1';

    const result = await syncSteamForUser({ includeDebug });
    if (!shouldRedirect) {
      return NextResponse.json(result);
    }

    return NextResponse.redirect(buildBacklogRedirect(req.url, 'success').toString());
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.redirect(buildBacklogRedirect(req.url, 'error', 'unauthorized').toString());
    }

    const message = error instanceof Error ? error.message : 'steam_sync_failed';
    console.error('Steam sync error:', error);
    return NextResponse.redirect(
      buildBacklogRedirect(req.url, 'error', message.slice(0, 120)).toString(),
    );
  }
}

export const POST = withApiRoute(POSTHandler);
export const GET = withApiRoute(GETHandler);
