import type { Database } from '@/lib/supabase/database.types';
import { searchRawgGames, fetchRawgGameDetails, type RawgGame } from '@/lib/services/rawgService';
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
  // Remove trademark symbols (™, ®, ©)
  return value.replace(/[™®©]/g, '').trim();
}

/**
 * Normalize title for MATCHING purposes (more aggressive).
 * Use this when COMPARING titles to find matches.
 */
export function normalizeForMatch(value?: string | null): string {
  let normalized = (value ?? '').trim();

  // Remove trademark symbols (™, ®, ©)
  normalized = normalized.replace(/[™®©]/g, '');

  // Remove edition tokens that break RAWG matching
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

// ============================================================================
// Status Mapping
// ============================================================================

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

// ============================================================================
// Platform Handling
// ============================================================================

/**
 * Merge platforms ensuring PC is included for Steam games.
 */
export function mergePlatforms(rawgPlatforms: string[] | null | undefined): string[] {
  const ordered = ['PC', ...(rawgPlatforms ?? [])].filter(Boolean) as string[];
  return Array.from(new Set(ordered));
}

export function getSteamHours(game: SteamOwnedGame): number | null {
  if (typeof game.playtime_forever !== 'number') {
    return null;
  }
  return Math.max(0, Math.floor(game.playtime_forever / 60));
}

// ============================================================================
// RAWG Matching & Enrichment
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

export async function matchSteamGamesToRawg(
  games: SteamGameWithAchievements[],
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
        const matched =
          candidates.find(candidate => normalizeForMatch(candidate.name) === key) ?? null;

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

export async function enrichRawgMatches(
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

// ============================================================================
// Media Item Building
// ============================================================================

/**
 * Build RAWG metadata patch for a Steam game.
 * EXACTLY like EditEntryDialog's sync_rawg_metadata action.
 * This should ONLY be called for NEW enrichment, NOT for already-enriched items.
 */
export function buildGameMetadataPatch(game: SteamGameWithAchievements, rawg: RawgGame) {
  const rawgGenres = rawg.genres?.map(item => item.name) ?? [];
  const rawgPlatforms = rawg.platforms?.map(item => item.platform.name) ?? [];
  const year = rawg.released ? Number.parseInt(rawg.released.slice(0, 4), 10) : null;

  // Safety: Ensure we have full RAWG data (not just search result)
  if (!rawg.background_image && !rawg.description_raw) {
    console.warn(`⚠️ buildGameMetadataPatch called with incomplete RAWG data for ${rawg.name}`);
  }

  // Clean titles: remove trademark symbols (™, ®, ©)
  const cleanTitle = cleanTitleForStorage(rawg.name ?? game.name ?? `Steam App ${game.appid}`);

  return {
    source: 'rawg',
    rawg_id: rawg.id,
    steam_app_id: game.appid,
    title: cleanTitle,
    title_english: cleanTitle,
    description: rawg.description_raw ?? null,
    cover_image_large: rawg.background_image ?? getSteamCoverUrls(game).large,
    cover_image_medium: rawg.background_image ?? getSteamCoverUrls(game).medium,
    season_year: Number.isFinite(year) ? year : null,
    release_date: rawg.released ?? null,
    rating: rawg.rating ?? null,
    metacritic: rawg.metacritic ?? null,
    platforms: mergePlatforms(rawgPlatforms), // PC + RAWG platforms (merged)
    genres: rawgGenres,
    developer: rawg.developers?.[0]?.name ?? null,
    publisher: rawg.publishers?.[0]?.name ?? null,
    esrb_rating: rawg.esrb_rating?.name ?? null,
    runtime: rawg.playtime ?? null,
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
    platforms: ['PC'], // Steam-only fallback = PC only
  } satisfies Database['public']['Tables']['media_items']['Insert'];
}
