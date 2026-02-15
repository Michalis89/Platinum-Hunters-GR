import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import type { Database } from '@/lib/supabase/database.types';
import { randomUUID } from 'crypto';
import {
  searchIgdbGames,
  fetchIgdbGameDetails,
  mapIgdbToPayload,
  type IgdbGame,
} from '@/lib/services/igdbService';
import {
  fetchSteamOwnedGames,
  fetchSteamAchievements,
  getSteamApiKey,
  getSteamCoverUrls,
  resolveSteamId64,
  type SteamOwnedGame,
} from '@/lib/integrations/steam';

type SyncProgress = {
  message: string;
  completedSteps: number;
  totalSteps: number;
  percent?: number;
};

type JobUpdate = {
  status?: 'running' | 'completed' | 'failed';
  message?: string;
  percent?: number;
  completedSteps?: number;
  totalSteps?: number;
  error?: string | null;
  result?: unknown;
  finishedAt?: string | null;
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
      achievementsPercent?: number;
      mappedStatus: 'planned' | 'current' | 'completed' | 'dropped';
    }>;
  };
};

async function createSyncJob(userId: string): Promise<string> {
  const supabase = await createRouteHandlerClient();
  const jobId = randomUUID();

  const { error } = await supabase.from('steam_sync_jobs').insert({
    id: jobId,
    user_id: userId,
    status: 'running',
    message: 'Starting Steam sync...',
    percent: 0,
    completed_steps: 0,
    total_steps: 1,
  });

  if (error) {
    console.error('Failed to create sync job:', error);
    throw new Error('Failed to create sync job');
  }

  return jobId;
}

async function updateSyncJob(jobId: string, updates: JobUpdate): Promise<void> {
  const supabase = await createRouteHandlerClient();

  const { error } = await supabase
    .from('steam_sync_jobs')
    .update({
      ...(updates.status && { status: updates.status }),
      ...(updates.message && { message: updates.message }),
      ...(typeof updates.percent === 'number' && { percent: updates.percent }),
      ...(typeof updates.completedSteps === 'number' && {
        completed_steps: updates.completedSteps,
      }),
      ...(typeof updates.totalSteps === 'number' && { total_steps: updates.totalSteps }),
      ...(updates.error !== undefined && { error: updates.error }),
      ...(updates.result !== undefined && {
        result:
          updates.result as unknown as Database['public']['Tables']['steam_sync_jobs']['Update']['result'],
      }),
      ...(updates.finishedAt !== undefined && { finished_at: updates.finishedAt }),
    })
    .eq('id', jobId);

  if (error) {
    console.warn('Failed to update sync job:', error);
    // Don't throw - progress updates are not critical
  }
}

function normalizeTitle(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

/**
 * Clean title for storage: remove trademark symbols.
 * Use this when STORING titles in the database.
 */
function cleanTitleForStorage(value?: string | null): string {
  if (!value) return '';
  // Remove trademark symbols.
  return value.replace(/[\u2122\u00AE\u00A9]/g, '').trim();
}

/**
 * Normalize title for MATCHING purposes (more aggressive).
 * Use this when COMPARING titles to find matches.
 */
function normalizeForMatch(value?: string | null): string {
  let normalized = (value ?? '').trim();

  // Remove trademark symbols.
  normalized = normalized.replace(/[\u2122\u00AE\u00A9]/g, '');

  // Remove edition tokens that break IGDB matching
  const editionTokens = [
    /\s*-?\s*Complete Edition/gi,
    /\s*-?\s*Definitive Edition/gi,
    /\s*-?\s*Remastered/gi,
    /\s*-?\s*Enhanced Edition/gi,
    /\s*-?\s*Game of the Year Edition/gi,
    /\s*-?\s*GOTY/gi,
    /\s*-?\s*Ultimate Edition/gi,
    /\s*-?\s*Deluxe Edition/gi,
    /\s*-?\s*Special Edition/gi,
    /\s*-?\s*Collector's Edition/gi,
    /\s*-?\s*Director's Cut/gi,
    /\s*-?\s*Bundle/gi,
    /\s*-?\s*DLC/gi,
  ];

  for (const pattern of editionTokens) {
    normalized = normalized.replace(pattern, '');
  }

  // Normalize to lowercase and remove non-alphanumeric
  return normalized
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();
}

/**
 * Map Steam game data to status based on playtime, last played, and achievements.
 * ONLY applies to steam-imported games. Never overrides user-edited status.
 *
 * Rules:
 * - If never played (playtime=0 AND last_played=0) => 'planned'
 * - If 100% achievements => 'completed'
 * - If not played in 90+ days AND has playtime => 'dropped'
 * - Otherwise => 'current'
 */
function deriveStatusFromSteamData(params: {
  playtimeMinutes?: number;
  lastPlayedUnix?: number;
  achievementsPercent?: number;
  droppedThresholdDays?: number;
}): 'planned' | 'current' | 'completed' | 'dropped' {
  const {
    playtimeMinutes = 0,
    lastPlayedUnix = 0,
    achievementsPercent,
    droppedThresholdDays = 90,
  } = params;

  // Never played => planned (backlog)
  if (playtimeMinutes === 0 && lastPlayedUnix === 0) {
    return 'planned';
  }

  // 100% achievements => completed
  if (achievementsPercent === 100) {
    return 'completed';
  }

  // Dropped: has playtime but not played in 90+ days
  if (lastPlayedUnix > 0 && playtimeMinutes > 0) {
    const lastPlayedDate = new Date(lastPlayedUnix * 1000);
    const daysSinceLastPlayed = (Date.now() - lastPlayedDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceLastPlayed > droppedThresholdDays) {
      return 'dropped';
    }
  }

  // Has playtime => current
  if (playtimeMinutes > 0) {
    return 'current';
  }

  // Default to planned
  return 'planned';
}

function buildDebugSample(games: SteamOwnedGame[], achievementsByAppId?: Map<number, number>) {
  return games.slice(0, 20).map(game => {
    return {
      appid: game.appid,
      name: game.name,
      playtime_forever: game.playtime_forever,
      playtime_2weeks: game.playtime_2weeks,
      rtime_last_played: game.rtime_last_played,
      has_community_visible_stats: game.has_community_visible_stats,
      achievementsPercent: achievementsByAppId?.get(game.appid),
      mappedStatus: deriveStatusFromSteamData({
        playtimeMinutes: game.playtime_forever,
        lastPlayedUnix: game.rtime_last_played,
        achievementsPercent: achievementsByAppId?.get(game.appid),
      }),
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

async function matchSteamGamesToIgdb(
  games: SteamOwnedGame[],
  onItemComplete?: (completed: number, total: number) => Promise<void> | void,
) {
  const cache = new Map<string, IgdbGame | null>();

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
        const candidates = await searchIgdbGames(title, 8);
        const matched =
          candidates.find(candidate => normalizeForMatch(candidate.name) === key) ?? null;

        cache.set(key, matched);
        return [game.appid, matched] as const;
      } catch (error) {
        console.warn(`IGDB search failed for "${title}":`, error);
        cache.set(key, null);
        return [game.appid, null] as const;
      }
    },
    onItemComplete,
  );

  return new Map<number, IgdbGame | null>(pairs);
}

async function enrichIgdbMatches(
  matchByAppId: Map<number, IgdbGame | null>,
  onItemComplete?: (completed: number, total: number) => Promise<void> | void,
) {
  const matchedIgdbIds = Array.from(
    new Set(
      Array.from(matchByAppId.values())
        .map(item => item?.id)
        .filter((id): id is number => typeof id === 'number'),
    ),
  );
  const detailsCache = new Map<number, IgdbGame | null>();

  if (matchedIgdbIds.length === 0) {
    return new Map<number, IgdbGame | null>();
  }

  await mapWithConcurrency(
    matchedIgdbIds,
    3,
    async igdbId => {
      try {
        const details = await fetchIgdbGameDetails(igdbId, { mainGameOnly: false });
        detailsCache.set(igdbId, details);
        return details;
      } catch (error) {
        console.warn(`IGDB details fetch failed for ID ${igdbId}:`, error);
        detailsCache.set(igdbId, null);
        return null;
      }
    },
    onItemComplete,
  );

  const enrichedByAppId = new Map<number, IgdbGame | null>();
  for (const [appid, matched] of matchByAppId.entries()) {
    if (!matched) {
      enrichedByAppId.set(appid, null);
      continue;
    }
    enrichedByAppId.set(appid, detailsCache.get(matched.id) ?? matched);
  }

  return enrichedByAppId;
}

/**
 * Merge platforms ensuring PC is included for Steam games.
 * Matches EditEntryDialog behavior.
 */
function mergePlatforms(igdbPlatforms: string[] | null | undefined): string[] {
  const ordered = ['PC', ...(igdbPlatforms ?? [])].filter(Boolean) as string[];
  return Array.from(new Set(ordered));
}

function getSteamHours(game: SteamOwnedGame): number | null {
  if (typeof game.playtime_forever !== 'number') {
    return null;
  }
  return Math.max(0, Math.floor(game.playtime_forever / 60));
}

/**
 * Build IGDB metadata patch for a Steam game.
 * This should ONLY be called for NEW enrichment, NOT for already-enriched items.
 */
function buildGameMetadataPatch(game: SteamOwnedGame, igdb: IgdbGame) {
  const payload = mapIgdbToPayload(igdb);
  const cleanTitle = cleanTitleForStorage(payload.title ?? game.name ?? `Steam App ${game.appid}`);

  return {
    source: 'igdb',
    rawg_id: payload.igdb_id,
    steam_app_id: game.appid,
    title: cleanTitle,
    title_english: cleanTitle,
    description: payload.description,
    cover_image_large: payload.cover_image_large ?? getSteamCoverUrls(game).large,
    cover_image_medium: payload.cover_image_medium ?? getSteamCoverUrls(game).medium,
    season_year: payload.season_year,
    release_date: payload.release_date,
    rating: payload.rating,
    platforms: mergePlatforms(payload.platforms),
    genres: payload.genres,
    developer: payload.developer,
    publisher: payload.publisher,
  } satisfies Database['public']['Tables']['media_items']['Update'];
}

function buildSteamFallbackInsert(game: SteamOwnedGame) {
  const covers = getSteamCoverUrls(game);
  const cleanTitle = cleanTitleForStorage(game.name ?? `Steam App ${game.appid}`);

  return {
    category: 'games',
    source: 'steam',
    steam_app_id: game.appid,
    title: cleanTitle,
    title_english: cleanTitle,
    cover_image_large: covers.large,
    cover_image_medium: covers.medium,
    platforms: ['PC'], // Steam-only fallback = PC only
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
  jobId?: string;
  onProgress?: (progress: SyncProgress) => Promise<void> | void;
}): Promise<SyncResult> {
  console.log('ðŸš€ [Steam Sync] Starting sync...', { jobId: options?.jobId });

  const supabase = await createRouteHandlerClient();
  const adminSupabase = createSupabaseAdminClient();
  const session = await requireAuth(supabase);

  let completedSteps = 0;
  let totalSteps = 1;
  const updateProgress = async (message: string, stepDelta = 0) => {
    completedSteps += stepDelta;
    const percent =
      totalSteps > 0 ? Math.min(100, Math.round((completedSteps / totalSteps) * 100)) : 0;

    console.log(
      `ðŸ“Š [Steam Sync] Progress: ${percent}% - ${message} (${completedSteps}/${totalSteps})`,
    );

    // Update job record if jobId provided
    if (options?.jobId) {
      await updateSyncJob(options.jobId, {
        message,
        completedSteps,
        totalSteps,
        percent,
      });
    }

    // Call progress callback
    await options?.onProgress?.({
      message,
      completedSteps,
      totalSteps,
      percent,
    });
  };

  await updateProgress('Î£ÏÎ½Î´ÎµÏƒÎ· Î¼Îµ Steam Ï€ÏÎ¿Ï†Î¯Î»...');

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('steam_id')
    .eq('id', session.user.id)
    .maybeSingle();

  if (userError) {
    console.error('âŒ [Steam Sync] User fetch error:', userError);
    throw userError;
  }

  const steamInput = userData?.steam_id?.trim();
  if (!steamInput) {
    console.error('âŒ [Steam Sync] No steam_id in user profile');
    throw new Error(
      'Î”ÎµÎ½ Î­Ï‡ÎµÎ¹Ï‚ Î¿ÏÎ¯ÏƒÎµÎ¹ Steam ID ÏƒÏ„Î¿ Ï€ÏÎ¿Ï†Î¯Î» ÏƒÎ¿Ï…. Î Î®Î³Î±Î¹Î½Îµ ÏƒÏ„Î¹Ï‚ ÏÏ…Î¸Î¼Î¯ÏƒÎµÎ¹Ï‚ Î³Î¹Î± Î½Î± Ï„Î¿ Ï€ÏÎ¿ÏƒÎ¸Î­ÏƒÎµÎ¹Ï‚.',
    );
  }

  console.log('ðŸ”‘ [Steam Sync] Fetching Steam API key...');
  const apiKey = getSteamApiKey();

  console.log('ðŸŽ® [Steam Sync] Resolving Steam ID64...');
  const steamId64 = await resolveSteamId64({ apiKey, steamInput });

  console.log('ðŸ“š [Steam Sync] Fetching owned games...');
  const steamGames = await fetchSteamOwnedGames({ apiKey, steamId64 });

  const uniqueGames = Array.from(
    new Map(steamGames.map(game => [game.appid, game] as const)).values(),
  ).filter(game => typeof game.appid === 'number' && game.appid > 0 && game.name);

  totalSteps = Math.max(12, uniqueGames.length * 4 + 8);
  await updateProgress(`Î’ÏÎ­Î¸Î·ÎºÎ±Î½ ${uniqueGames.length} Ï€Î±Î¹Ï‡Î½Î¯Î´Î¹Î± Î±Ï€ÏŒ Steam.`, 1);

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

  // Fetch achievements for games with stats (throttled to avoid rate limits)
  await updateProgress('Î‘Î½Î¬ÎºÏ„Î·ÏƒÎ· achievements...', 1);
  const achievementsPercentByAppId = new Map<number, number>();
  const gamesWithStats = uniqueGames.filter(g => g.has_community_visible_stats);

  if (gamesWithStats.length > 0) {
    totalSteps += gamesWithStats.length;
    await mapWithConcurrency(
      gamesWithStats,
      2, // Very conservative concurrency for achievements API
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

  await updateProgress('Î‘Î½Ï„Î¹ÏƒÏ„Î¿Î¯Ï‡Î¹ÏƒÎ· Ï„Î¯Ï„Î»Ï‰Î½ Steam Î¼Îµ IGDB...', 1);
  const igdbMatchByAppId = await matchSteamGamesToIgdb(uniqueGames, async (done, total) => {
    await updateProgress(`Î‘Î½Ï„Î¹ÏƒÏ„Î¿Î¯Ï‡Î¹ÏƒÎ· IGDB ${done}/${total}`, 1);
  });

  // Fetch existing media items first (needed for enrichment filtering)
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

  await updateProgress('Î‘Î½Î¬ÎºÏ„Î·ÏƒÎ· IGDB metadata...', 0);

  // Filter matches: skip enrichment for items that already have IGDB metadata
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
      // Already have enriched data for this IGDB ID - reuse the basic match
      igdbMatchesAlreadyEnriched.set(appid, igdbMatch);
    } else {
      // Need to fetch details
      igdbMatchesNeedingEnrichment.set(appid, igdbMatch);
    }
  }

  const needsEnrichmentCount = Array.from(igdbMatchesNeedingEnrichment.values()).filter(
    Boolean,
  ).length;
  totalSteps += needsEnrichmentCount;

  const enrichedIgdbByAppId = await enrichIgdbMatches(
    igdbMatchesNeedingEnrichment,
    async (done, total) => {
      await updateProgress(`IGDB metadata ${done}/${total}`, 1);
    },
  );

  // Merge already-enriched items back in
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

  const mediaIdByAppId = new Map<number, number>();
  const insertTasks: Array<{
    appid: number;
    payload: Database['public']['Tables']['media_items']['Insert'];
  }> = [];
  const updateByMediaId = new Map<number, Database['public']['Tables']['media_items']['Update']>();

  await updateProgress('Î£Ï…Î³Ï‡ÏÎ¿Î½Î¹ÏƒÎ¼ÏŒÏ‚ catalog media...', 1);
  for (const game of uniqueGames) {
    const matchedIgdb = enrichedIgdbByAppId.get(game.appid) ?? null;
    const existingByAppId = mediaByAppId.get(game.appid);

    if (existingByAppId) {
      mediaIdByAppId.set(game.appid, existingByAppId.id);

      // CRITICAL: Check if this item is already IGDB-enriched
      // If yes, ONLY update steam_app_id + runtime
      // NEVER touch: images, platforms, description, genres, developer, publisher, etc.
      const isAlreadyEnriched = existingByAppId.source === 'igdb' && existingByAppId.rawg_id;

      if (isAlreadyEnriched) {
        // âœ… PRESERVING EXISTING IGDB DATA (images, platforms, etc.)
        console.log(
          `âœ… [Steam Sync] Preserving IGDB data for: ${game.name} (IGDB ID: ${existingByAppId.rawg_id})`,
        );
        updateByMediaId.set(existingByAppId.id, {
          steam_app_id: game.appid,
          runtime: getSteamHours(game),
        });
      } else if (matchedIgdb) {
        // ðŸ†• NEW IGDB ENRICHMENT (item has no IGDB data yet)
        console.log(
          `ðŸ†• [Steam Sync] Enriching with IGDB: ${game.name} (IGDB ID: ${matchedIgdb.id})`,
        );
        updateByMediaId.set(existingByAppId.id, buildGameMetadataPatch(game, matchedIgdb));
      } else {
        // No IGDB match found, just update Steam fields
        updateByMediaId.set(existingByAppId.id, {
          steam_app_id: game.appid,
          runtime: getSteamHours(game),
        });
      }
      await updateProgress(
        `Catalog ÎµÎ½Î·Î¼Î­ÏÏ‰ÏƒÎ· ${mediaIdByAppId.size}/${uniqueGames.length}`,
        1,
      );
      continue;
    }

    if (matchedIgdb) {
      const existingIgdbMedia = existingIgdbMediaByIgdbId.get(matchedIgdb.id);
      if (existingIgdbMedia) {
        mediaIdByAppId.set(game.appid, existingIgdbMedia.id);
        // âœ… PRESERVING: Game exists with same IGDB ID (already enriched)
        console.log(
          `âœ… [Steam Sync] Preserving existing IGDB media: ${game.name} (IGDB ID: ${matchedIgdb.id})`,
        );
        updateByMediaId.set(existingIgdbMedia.id, {
          steam_app_id: game.appid,
          runtime: getSteamHours(game),
        });
        await updateProgress(
          `Catalog ÎµÎ½Î·Î¼Î­ÏÏ‰ÏƒÎ· ${mediaIdByAppId.size}/${uniqueGames.length}`,
          1,
        );
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
      insertTasks.push({
        appid: game.appid,
        payload: buildSteamFallbackInsert(game),
      });
    }

    await updateProgress(
      `Catalog ÎµÎ½Î·Î¼Î­ÏÏ‰ÏƒÎ· ${mediaIdByAppId.size + insertTasks.length}/${uniqueGames.length}`,
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
          console.error(`âŒ Media update failed for ID ${mediaId}:`, error);
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
    if (normalizedTitle) userTitleSet.add(normalizedTitle);
    if (normalizedEnglishTitle) userTitleSet.add(normalizedEnglishTitle);
  }

  const userEntryPayload: Database['public']['Tables']['user_media_entries']['Insert'][] = [];
  const userEntryUpdates: Database['public']['Tables']['user_media_entries']['Insert'][] = [];
  let skippedPotentialDuplicate = 0;

  await updateProgress('Î£Ï…Î³Ï‡ÏÎ¿Î½Î¹ÏƒÎ¼ÏŒÏ‚ user entries...', 1);
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
      // Only update if import_source='steam' (don't touch manual or other imports)
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

  await updateProgress(
    'ÎŸÎ»Î¿ÎºÎ»Î®ÏÏ‰ÏƒÎ· ÏƒÏ…Î³Ï‡ÏÎ¿Î½Î¹ÏƒÎ¼Î¿Ï...',
    totalSteps - completedSteps,
  );

  const warnings: string[] = [];
  if (failedMediaInsertCount > 0)
    warnings.push(`Î‘Ï€Î¿Ï„Ï…Ï‡Î·Î¼Î­Î½ÎµÏ‚ ÎµÎ¹ÏƒÎ±Î³Ï‰Î³Î­Ï‚ media: ${failedMediaInsertCount}`);
  if (failedMediaUpdateCount > 0)
    warnings.push(`Î‘Ï€Î¿Ï„Ï…Ï‡Î·Î¼Î­Î½Î± updates media: ${failedMediaUpdateCount}`);
  if (failedEntryUpsertCount > 0)
    warnings.push(`Î‘Ï€Î¿Ï„Ï…Ï‡Î·Î¼Î­Î½Î± inserts/updates entries: ${failedEntryUpsertCount}`);

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

    // Create job for progress tracking
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    jobId = await createSyncJob(session.user.id);

    // Run sync with job tracking
    const result = await syncSteamForUser({ includeDebug, jobId });

    // Mark job as completed
    await updateSyncJob(jobId, {
      status: 'completed',
      message: 'ÎŸ ÏƒÏ…Î³Ï‡ÏÎ¿Î½Î¹ÏƒÎ¼ÏŒÏ‚ Î¿Î»Î¿ÎºÎ»Î·ÏÏŽÎ¸Î·ÎºÎµ ÎµÏ€Î¹Ï„Ï…Ï‡ÏŽÏ‚',
      percent: 100,
      result: result,
      finishedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ...result, jobId });
  } catch (error) {
    // Mark job as failed if we created one
    if (jobId) {
      const errorMessage = error instanceof Error ? error.message : 'Î†Î³Î½Ï‰ÏƒÏ„Î¿ ÏƒÏ†Î¬Î»Î¼Î±';
      await updateSyncJob(jobId, {
        status: 'failed',
        message: 'ÎŸ ÏƒÏ…Î³Ï‡ÏÎ¿Î½Î¹ÏƒÎ¼ÏŒÏ‚ Î±Ï€Î­Ï„Ï…Ï‡Îµ',
        error: errorMessage,
        finishedAt: new Date().toISOString(),
      }).catch(console.error);
    }

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Î‘Ï€Î¿Ï„Ï…Ï‡Î¯Î± ÏƒÏ…Î³Ï‡ÏÎ¿Î½Î¹ÏƒÎ¼Î¿Ï Î²Î¹Î²Î»Î¹Î¿Î¸Î®ÎºÎ·Ï‚ Steam';
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

    // Create job for progress tracking
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    jobId = await createSyncJob(session.user.id);

    const result = await syncSteamForUser({ includeDebug, jobId });

    // Mark job as completed
    await updateSyncJob(jobId, {
      status: 'completed',
      message: 'ÎŸ ÏƒÏ…Î³Ï‡ÏÎ¿Î½Î¹ÏƒÎ¼ÏŒÏ‚ Î¿Î»Î¿ÎºÎ»Î·ÏÏŽÎ¸Î·ÎºÎµ ÎµÏ€Î¹Ï„Ï…Ï‡ÏŽÏ‚',
      percent: 100,
      result: result,
      finishedAt: new Date().toISOString(),
    });

    if (!shouldRedirect) {
      return NextResponse.json({ ...result, jobId });
    }

    return NextResponse.redirect(buildBacklogRedirect(req.url, 'success').toString());
  } catch (error) {
    // Mark job as failed if we created one
    if (jobId) {
      const errorMessage = error instanceof Error ? error.message : 'Î†Î³Î½Ï‰ÏƒÏ„Î¿ ÏƒÏ†Î¬Î»Î¼Î±';
      await updateSyncJob(jobId, {
        status: 'failed',
        message: 'ÎŸ ÏƒÏ…Î³Ï‡ÏÎ¿Î½Î¹ÏƒÎ¼ÏŒÏ‚ Î±Ï€Î­Ï„Ï…Ï‡Îµ',
        error: errorMessage,
        finishedAt: new Date().toISOString(),
      }).catch(console.error);
    }

    if (error instanceof UnauthorizedError) {
      return NextResponse.redirect(
        buildBacklogRedirect(req.url, 'error', 'unauthorized').toString(),
      );
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
