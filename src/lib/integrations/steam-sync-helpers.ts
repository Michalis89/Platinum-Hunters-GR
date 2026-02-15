import type { Database } from '@/lib/supabase/database.types';
import {
  fetchIgdbGameDetails,
  mapIgdbToPayload,
  searchIgdbGames,
  type IgdbGame,
} from '@/lib/services/igdbService';
import { getSteamCoverUrls, type SteamOwnedGame } from './steam';

export type SteamGameWithAchievements = SteamOwnedGame & {
  achievementsPercent?: number;
};

// ============================================================================
// Normalization & Cleaning
// ============================================================================

export function normalizeTitle(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

/**
 * Clean title for storage: remove trademark symbols.
 * Use this when STORING titles in the database.
 */
export function cleanTitleForStorage(value?: string | null): string {
  if (!value) return '';
  return value.replace(/[\u2122\u00AE\u00A9]/g, '').trim();
}

/**
 * Normalize title for MATCHING purposes (more aggressive).
 * Use this when COMPARING titles to find matches.
 */
export function normalizeForMatch(value?: string | null): string {
  let normalized = (value ?? '').trim();

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

  return normalized
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();
}

// ============================================================================
// Status Mapping
// ============================================================================

/**
 * Map Steam game data to status based on playtime, last played, and achievements.
 * ONLY applies to steam-imported games. Never overrides user-edited status.
 */
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

// ============================================================================
// Platform Handling
// ============================================================================

/**
 * Merge platforms ensuring PC is included for Steam games.
 */
export function mergePlatforms(platforms: string[] | null | undefined): string[] {
  const ordered = ['PC', ...(platforms ?? [])].filter(Boolean) as string[];
  return Array.from(new Set(ordered));
}

export function getSteamHours(game: SteamOwnedGame): number | null {
  if (typeof game.playtime_forever !== 'number') {
    return null;
  }
  return Math.max(0, Math.floor(game.playtime_forever / 60));
}

// ============================================================================
// IGDB Matching & Enrichment
// ============================================================================

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

export async function matchSteamGamesToIgdb(
  games: SteamGameWithAchievements[],
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

export async function enrichIgdbMatches(
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

// ============================================================================
// Media Item Building
// ============================================================================

/**
 * Build IGDB metadata patch for a Steam game.
 * This should ONLY be called for NEW enrichment, NOT for already-enriched items.
 */
export function buildGameMetadataPatch(game: SteamGameWithAchievements, igdbGame: IgdbGame) {
  const payload = mapIgdbToPayload(igdbGame);
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

export function buildSteamFallbackInsert(game: SteamGameWithAchievements) {
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
    platforms: ['PC'],
  } satisfies Database['public']['Tables']['media_items']['Insert'];
}
