import type { Database } from '@/lib/supabase/database.types';
import { mapIgdbToPayload, type IgdbGame } from '@/lib/services/igdbService';
import { getSteamCoverUrls, type SteamOwnedGame } from '@/lib/integrations/steam';

export type SyncProgress = {
  message: string;
  completedSteps: number;
  totalSteps: number;
  percent?: number;
};

export type JobUpdate = {
  status?: 'running' | 'completed' | 'failed';
  message?: string;
  percent?: number;
  completedSteps?: number;
  totalSteps?: number;
  error?: string | null;
  result?: unknown;
  finishedAt?: string | null;
};

export type SyncResult = {
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
  rejectedGames?: Array<{ appid: number; name: string; reason: string }>;
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

export class SyncAlreadyRunningError extends Error {
  jobId: string | null;

  constructor(jobId: string | null) {
    super('A sync is already in progress.');
    this.name = 'SyncAlreadyRunningError';
    this.jobId = jobId;
  }
}

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
      return maybeMessage;
    }
  }
  return fallback;
}

export function normalizeTitle(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

export function cleanTitleForStorage(value?: string | null): string {
  if (!value) {
    return '';
  }
  return value.replace(/[\u2122\u00AE\u00A9]/g, '').trim();
}

export function normalizeForMatch(value?: string | null): string {
  let normalized = (value ?? '').trim();

  normalized = normalized.replace(/[\u2122\u00AE\u00A9]/g, '');

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

  return normalized
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();
}

export function deriveStatusFromSteamData(params: {
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

  if (playtimeMinutes === 0 && lastPlayedUnix === 0) {
    return 'planned';
  }

  if (achievementsPercent === 100) {
    return 'completed';
  }

  if (lastPlayedUnix > 0 && playtimeMinutes > 0) {
    const lastPlayedDate = new Date(lastPlayedUnix * 1000);
    const daysSinceLastPlayed = (Date.now() - lastPlayedDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceLastPlayed > droppedThresholdDays) {
      return 'dropped';
    }
  }

  if (playtimeMinutes > 0) {
    return 'current';
  }

  return 'planned';
}

export function buildDebugSample(
  games: SteamOwnedGame[],
  achievementsByAppId?: Map<number, number>,
) {
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

export async function mapWithConcurrency<TInput, TOutput>(
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

/**
 * Merge platforms ensuring PC is included for Steam games.
 * Matches EditEntryDialog behavior.
 */
export function mergePlatforms(igdbPlatforms: string[] | null | undefined): string[] {
  const ordered = ['PC', ...(igdbPlatforms ?? [])].filter(Boolean) as string[];
  return Array.from(new Set(ordered));
}

export function getSteamHours(game: SteamOwnedGame): number | null {
  if (typeof game.playtime_forever !== 'number') {
    return null;
  }
  return Math.max(0, Math.floor(game.playtime_forever / 60));
}

/**
 * Build IGDB metadata patch for a Steam game.
 * This should ONLY be called for NEW enrichment, NOT for already-enriched items.
 */
export function buildGameMetadataPatch(game: SteamOwnedGame, igdb: IgdbGame) {
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

export function buildBacklogRedirect(
  requestUrl: string,
  status: 'success' | 'error',
  reason?: string,
) {
  const redirectUrl = new URL('/backlog?category=games', requestUrl);
  redirectUrl.searchParams.set('steam', status);
  if (reason) {
    redirectUrl.searchParams.set('steam_reason', reason);
  }
  return redirectUrl;
}
