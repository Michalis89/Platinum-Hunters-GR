import type { Database } from '@/lib/supabase/database.types';
import {
  fetchIgdbGameDetails,
  mapIgdbToPayload,
  searchIgdbGames,
  searchIgdbGamesWithoutCategoryFilter,
  findIgdbGameIdBySteamAppId,
  type IgdbGame,
} from '@/lib/services/igdbService';
import { isAllowedIgdbGameCandidate } from '@/lib/igdb/categories';
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
 * Clean title for storage: remove trademark symbols, superscripts, and other decorative symbols.
 * Use this when STORING titles in the database.
 */
export function cleanTitleForStorage(value?: string | null): string {
  if (!value) return '';

  // Remove all trademark, copyright, and decorative symbols
  return value
    .replace(/[\u2122\u00AE\u00A9]/g, '') // ™ ® ©
    .replace(/[\u00B2\u00B3\u00B9]/g, '') // Superscripts ² ³ ¹
    .replace(/[\u2120\u2121]/g, '') // ℠ ℡ Service mark, telephone sign
    .replace(/[\u00AE\u24C7\u24C7]/g, '') // Additional ® variants
    .replace(/[\u2022\u2023\u2043]/g, '') // Bullets •‣⁃
    .replace(/[\u00B7\u00B8]/g, '') // Middle dot, cedilla
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim();
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

/**
 * Calculate string similarity using Jaro-Winkler distance (0-1, higher = more similar)
 * Simple implementation for fuzzy matching game titles
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;

  const len1 = str1.length;
  const len2 = str2.length;

  // Use simple approach: count matching characters in order
  let matches = 0;
  const maxLen = Math.max(len1, len2);

  for (let i = 0; i < Math.min(len1, len2); i++) {
    if (str1[i] === str2[i]) {
      matches++;
    }
  }

  // Bonus for matching prefix (Jaro-Winkler style)
  let prefixLen = 0;
  for (let i = 0; i < Math.min(4, len1, len2); i++) {
    if (str1[i] === str2[i]) {
      prefixLen++;
    } else {
      break;
    }
  }

  const baseSimilarity = matches / maxLen;
  const prefixBonus = prefixLen * 0.1 * (1 - baseSimilarity);

  return Math.min(1, baseSimilarity + prefixBonus);
}

/**
 * Rate limiter for IGDB API calls (free tier: 4 req/sec)
 * Adds 300ms delay between calls to stay safely under limit
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
let lastApiCallTime = 0;
const MIN_API_CALL_INTERVAL_MS = 300; // ~3 calls per second (safe margin)

async function rateLimitedApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCallTime;

  if (timeSinceLastCall < MIN_API_CALL_INTERVAL_MS) {
    await sleep(MIN_API_CALL_INTERVAL_MS - timeSinceLastCall);
  }

  lastApiCallTime = Date.now();
  return apiCall();
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

export async function matchSteamGamesToIgdb(
  games: SteamGameWithAchievements[],
  onItemComplete?: (completed: number, total: number) => Promise<void> | void,
) {
  const cache = new Map<string, IgdbGame | null>();

  const pairs = await mapWithConcurrency(
    games,
    2, // Conservative for IGDB free tier (4 req/sec limit)
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
        // Strategy 1: Try direct Steam App ID lookup first (much faster!)
        // This uses 1 API call to external_games, then 1 for game details = 2 calls
        const igdbId = await rateLimitedApiCall(() => findIgdbGameIdBySteamAppId(game.appid));
        if (igdbId) {
          const igdbGame = await rateLimitedApiCall(() =>
            fetchIgdbGameDetails(igdbId, { mainGameOnly: false }),
          );
          if (igdbGame) {
            cache.set(key, igdbGame);
            return [game.appid, igdbGame] as const;
          }
        }

        // Strategy 2: Fallback to text search if direct lookup fails
        // First try with category filter (stricter)
        let candidates = await rateLimitedApiCall(() => searchIgdbGames(title, 8));

        // If no results with category filter, try without filter (broader search)
        if (candidates.length === 0) {
          const allCandidates = await rateLimitedApiCall(() =>
            searchIgdbGamesWithoutCategoryFilter(title, 16),
          );
          // Filter to only allowed candidates
          candidates = allCandidates.filter(candidate =>
            isAllowedIgdbGameCandidate({
              category: candidate.category,
              name: candidate.name,
              slug: candidate.slug ?? null,
            }),
          );
        }

        // Try exact normalized match first
        let matched = candidates.find(candidate => normalizeForMatch(candidate.name) === key);

        // If exact match fails, try less aggressive normalization (keep spaces, basic cleanup)
        if (!matched) {
          const basicNormalized = title.toLowerCase().replace(/[™®©]/g, '').trim();
          matched = candidates.find(candidate => {
            const candidateBasic = candidate.name.toLowerCase().replace(/[™®©]/g, '').trim();
            return candidateBasic === basicNormalized;
          });
        }

        // If still no match, try first result if it's very similar
        if (!matched && candidates.length > 0) {
          const firstCandidate = candidates[0];
          const similarity = calculateSimilarity(
            normalizeForMatch(title),
            normalizeForMatch(firstCandidate.name),
          );
          // Accept if >80% similar (catches minor differences)
          if (similarity > 0.8) {
            matched = firstCandidate;
          }
        }

        cache.set(key, matched ?? null);
        return [game.appid, matched ?? null] as const;
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
    2, // Conservative for IGDB free tier (4 req/sec limit)
    async igdbId => {
      try {
        const details = await rateLimitedApiCall(() =>
          fetchIgdbGameDetails(igdbId, { mainGameOnly: false }),
        );
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

