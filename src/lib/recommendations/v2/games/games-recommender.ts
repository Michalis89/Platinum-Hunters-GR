/**
 * V2 Games Recommender
 *
 * Main entry point with data-driven, adaptive scoring
 */

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { buildUserPreferences } from '../core/preference-analyzer';
import { calculateGenreCoverage } from '../core/genre-coverage';
import { scoreBacklogItems, scoreDatabaseGames } from './games-scorer';
import { RECOMMENDATION_LIMITS, MIN_POPULARITY } from '../core/scoring-engine';
import type { Recommendation, UserGenreAffinity, UserMediaEntry } from '../types';

type SupabaseClient = Awaited<ReturnType<typeof createRouteHandlerClient>>;
const DATABASE_FETCH_PAGE_SIZE = 500;

/**
 * Database query result types (matching Supabase nullability)
 */
type UserMediaEntryRow = {
  id: number;
  media_id: number;
  status: string; // Database returns as string, we cast to union type
  score: number | null;
  progress: number | null;
  priority: number | null;
  is_favorite: boolean | null;
  pinned_rank: number | null;
  updated_at: string | null;
  media_items: {
    id: number;
    title: string | null;
    category: string | null;
    genres: string[] | null;
    igdb_themes: string[] | null;
    platforms: string[] | null;
    cover_url_big: string | null;
    cover_url_thumb: string | null;
    cover_image_large: string | null;
    cover_image_medium: string | null;
  };
};

type MediaItemRow = {
  id: number;
  title: string | null;
  igdb_slug: string | null;
  genres: string[] | null;
  igdb_themes: string[] | null;
  platforms: string[] | null;
  cover_url_big: string | null;
  cover_url_thumb: string | null;
  cover_image_large: string | null;
  cover_image_medium: string | null;
};

type CategoryProfile = {
  games?: {
    favorite_platform?: string;
  };
  [key: string]: unknown;
};

/**
 * Generate game recommendations for a user (V2)
 *
 * @param userId - User ID
 * @returns Array of recommendations (max 4)
 */
type RecommendationLimitsOverride = {
  backlog?: number;
  database?: number;
  databaseFallback?: number;
  total?: number;
};

type PlatformFilterMode = 'off' | 'owned-only';

type GameRecommendationOptions = {
  platformFilterMode?: PlatformFilterMode;
};

export async function generateGameRecommendationsV2(
  userId: string,
  options?: GameRecommendationOptions,
): Promise<Recommendation[]> {
  return generateGameRecommendationsV2WithLimits(userId, undefined, options);
}

export async function generateGameRecommendationsV2WithLimits(
  userId: string,
  limits?: RecommendationLimitsOverride,
  options?: GameRecommendationOptions,
): Promise<Recommendation[]> {
  const supabase = await createRouteHandlerClient();
  const maxBacklog = limits?.backlog ?? RECOMMENDATION_LIMITS.BACKLOG;
  const maxDatabase = limits?.database ?? RECOMMENDATION_LIMITS.DATABASE;
  const maxDatabaseFallback = limits?.databaseFallback ?? RECOMMENDATION_LIMITS.DATABASE_FALLBACK;
  const maxTotal = limits?.total ?? RECOMMENDATION_LIMITS.TOTAL;
  const platformFilterMode = options?.platformFilterMode ?? 'off';

  // Load genre coverage first (for generic detection)
  const coverageMap = await calculateGenreCoverage(supabase, 'games');

  // Load user data
  const [genreAffinities, mediaHistory, categoryProfile, selectedPlatforms] = await Promise.all([
    loadUserGenreAffinities(supabase, userId),
    loadUserMediaHistory(supabase, userId),
    loadUserCategoryProfile(supabase, userId),
    loadUserSelectedPlatforms(supabase, userId),
  ]);

  // Extract platform preferences
  const favoritePlatform = categoryProfile?.games?.favorite_platform ?? null;
  const secondFavoritePlatform = null; // TODO: Add to profile
  const userOwnedPlatforms = buildUserOwnedPlatformSet(selectedPlatforms, favoritePlatform);

  // Build user preferences (with quality signals)
  const preferences = buildUserPreferences(
    genreAffinities,
    mediaHistory,
    favoritePlatform,
    secondFavoritePlatform,
  );

  // Score backlog items
  const backlogEntries = mediaHistory.filter(e => e.status === 'planned');
  const scoredBacklog = scoreBacklogItems(backlogEntries, preferences, coverageMap);

  // Determine split
  const numFromBacklog = Math.min(scoredBacklog.length, maxBacklog);
  const numFromDatabase =
    numFromBacklog < maxBacklog
      ? maxDatabaseFallback - numFromBacklog
      : maxDatabase;

  // Get backlog recommendations
  const backlogRecommendations = scoredBacklog.slice(0, numFromBacklog).map(item => ({
    mediaId: item.entry.mediaId,
    category: 'games' as const,
    title: item.entry.media.title,
    cover:
      item.entry.media.coverImageLarge || item.entry.media.coverImageMedium || '',
    slug: titleToSlug(item.entry.media.title),
    reason: item.reason,
    confidence: item.finalScore / 100, // Direct mapping from score (0-100) to confidence (0-1)
    source: 'backlog' as const,
    genres: item.entry.media.genres,
    tags: [],
    primaryGenre: item.entry.media.genres[0],
    score: item.finalScore,
  }));

  // Load and score database games
  const existingMediaIds = new Set(mediaHistory.map(e => e.mediaId));
  const ownedGameIdentityKeys = new Set(
    mediaHistory.map(entry => normalizeGameIdentityKey(entry.media.title)).filter(Boolean),
  );
  const databaseGames = await loadDatabaseGames(supabase, existingMediaIds, ownedGameIdentityKeys);
  const platformCompatibleDatabaseGames =
    platformFilterMode === 'owned-only'
      ? databaseGames.filter(game => isPlatformCompatible(game.platforms, userOwnedPlatforms))
      : databaseGames;

  const scoredDatabase = scoreDatabaseGames(
    platformCompatibleDatabaseGames,
    preferences,
    coverageMap,
    mediaHistory.map(entry => ({
      title: entry.media.title,
      score: entry.score,
      isFavorite: entry.isFavorite,
      status: entry.status,
    })),
  );

  const databaseRecommendations = scoredDatabase.slice(0, numFromDatabase).map(item => ({
    mediaId: item.mediaId,
    category: 'games' as const,
    title: item.title,
    cover: item.cover,
    slug: item.slug,
    reason: item.matchReason,
    confidence: item.finalScore / 100, // Direct mapping from score (0-100) to confidence (0-1)
    source: 'database' as const,
    genres: item.genres,
    tags: [],
    primaryGenre: item.primaryGenre,
    score: item.finalScore,
  }));

  const recommendations = [...backlogRecommendations, ...databaseRecommendations].slice(0, maxTotal);

  return recommendations;
}

async function loadUserSelectedPlatforms(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_media_entries')
    .select('selected_platform, media_items!inner(category)')
    .eq('user_id', userId)
    .in('media_items.category', ['games', 'game']);

  if (error) {
    console.error('[GameRecommenderV2] Error loading selected platforms:', error);
    return [];
  }

  const platforms = new Set<string>();
  for (const row of data ?? []) {
    const value = typeof row.selected_platform === 'string' ? row.selected_platform.trim() : '';
    if (value) {
      platforms.add(value);
    }
  }
  return Array.from(platforms);
}

function buildUserOwnedPlatformSet(
  selectedPlatforms: string[],
  favoritePlatform: string | null,
): Set<string> {
  const normalized = new Set<string>();
  for (const platform of selectedPlatforms) {
    const key = normalizePlatformKey(platform);
    if (key) {
      normalized.add(key);
    }
  }

  const favoriteKey = normalizePlatformKey(favoritePlatform ?? '');
  if (favoriteKey) {
    normalized.add(favoriteKey);
  }

  return normalized;
}

function isPlatformCompatible(candidatePlatforms: string[], userPlatforms: Set<string>): boolean {
  if (userPlatforms.size === 0 || candidatePlatforms.length === 0) {
    return true;
  }

  const candidateKeys = candidatePlatforms.map(normalizePlatformKey).filter(Boolean);
  if (candidateKeys.length === 0) {
    return true;
  }

  return candidateKeys.some(key => userPlatforms.has(key));
}

function normalizePlatformKey(value: string): string {
  const normalized = value.toLowerCase().trim();
  if (!normalized) {
    return '';
  }

  if (
    normalized.includes('android') ||
    normalized.includes('ios') ||
    normalized.includes('iphone') ||
    normalized.includes('ipad') ||
    normalized.includes('mobile')
  ) {
    return 'mobile';
  }
  if (
    normalized.includes('pc') ||
    normalized.includes('windows') ||
    normalized.includes('linux') ||
    normalized.includes('mac') ||
    normalized.includes('steam')
  ) {
    return 'pc';
  }
  if (normalized.includes('playstation') || normalized.startsWith('ps')) {
    return 'playstation';
  }
  if (normalized.includes('xbox')) {
    return 'xbox';
  }
  if (
    normalized.includes('switch') ||
    normalized.includes('nintendo') ||
    normalized.includes('wii') ||
    normalized.includes('3ds') ||
    normalized.includes('ds')
  ) {
    return 'nintendo';
  }

  return normalized;
}

/**
 * Load user's genre affinities
 */
async function loadUserGenreAffinities(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserGenreAffinity[]> {
  const { data, error } = await supabase
    .from('user_genre_affinity')
    .select('genre, score, item_count, strong_signal_count')
    .eq('user_id', userId)
    .eq('category', 'games')
    .order('score', { ascending: false });

  if (error) {
    console.error('[GameRecommenderV2] Error loading genre affinities:', error);
    return [];
  }

  return (data || []).map(row => ({
    genre: row.genre,
    score: parseFloat(String(row.score)),
    itemCount: row.item_count,
    strongSignalCount: row.strong_signal_count,
    signalRatio: 0, // Will be calculated in buildUserPreferences
  }));
}

/**
 * Load user's media history
 */
async function loadUserMediaHistory(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserMediaEntry[]> {
  const { data, error } = await supabase
    .from('user_media_entries')
    .select(
      `
      id,
      media_id,
      status,
      score,
      progress,
      priority,
      is_favorite,
      pinned_rank,
      updated_at,
      media_items!inner(
        id,
        title,
        category,
        genres,
        igdb_themes,
        platforms,
        cover_url_big,
        cover_url_thumb,
        cover_image_large,
        cover_image_medium
      )
    `,
    )
    .in('media_items.category', ['games', 'game'])
    .eq('user_id', userId);

  if (error) {
    console.error('[GameRecommenderV2] Error loading media history:', error);
    return [];
  }

  return (data || []).map((row: UserMediaEntryRow) => ({
    id: row.id,
    mediaId: row.media_id,
    status: row.status as 'planned' | 'current' | 'completed' | 'dropped',
    score: row.score,
    progress: row.progress,
    priority: row.priority,
    isFavorite: row.is_favorite ?? false,
    pinnedRank: row.pinned_rank,
    updatedAt: row.updated_at ?? new Date().toISOString(),
    media: {
      id: row.media_items.id,
      title: row.media_items.title ?? 'Untitled',
      category: row.media_items.category ?? 'games',
      genres: row.media_items.genres || [],
      themes: row.media_items.igdb_themes || [],
      platforms: row.media_items.platforms || [],
      coverImageLarge:
        row.media_items.cover_url_big ??
        row.media_items.cover_image_large ??
        row.media_items.cover_url_thumb ??
        row.media_items.cover_image_medium ??
        undefined,
      coverImageMedium:
        row.media_items.cover_url_thumb ?? row.media_items.cover_image_medium ?? undefined,
    },
  }));
}

/**
 * Load user's category profile
 */
async function loadUserCategoryProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<CategoryProfile | null> {
  const { data, error } = await supabase
    .from('user_category_profiles')
    .select('profiles')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[GameRecommenderV2] Error loading category profile:', error);
    return null;
  }

  return data?.profiles as CategoryProfile | null;
}

/**
 * Load games from database
 */
async function loadDatabaseGames(
  supabase: SupabaseClient,
  existingMediaIds: Set<number>,
  ownedGameIdentityKeys: Set<string>,
): Promise<
  Array<{
    id: number;
    title: string;
    coverImageLarge?: string;
    coverImageMedium?: string;
    slug: string;
    genres: string[];
    themes: string[];
    platforms: string[];
    popularityScore?: number;
  }>
> {
  const allRows: MediaItemRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('media_items')
      .select(
        `
        id,
        title,
        igdb_slug,
        genres,
        igdb_themes,
        platforms,
        cover_url_big,
        cover_url_thumb,
        cover_image_large,
        cover_image_medium
      `,
      )
      .in('category', ['games', 'game'])
      .order('id', { ascending: false })
      .range(offset, offset + DATABASE_FETCH_PAGE_SIZE - 1);

    if (error) {
      console.error('[GameRecommenderV2] Error loading database games:', error);
      return [];
    }

    const pageRows = (data || []) as MediaItemRow[];
    if (pageRows.length === 0) {
      break;
    }

    allRows.push(...pageRows);
    if (pageRows.length < DATABASE_FETCH_PAGE_SIZE) {
      break;
    }

    offset += DATABASE_FETCH_PAGE_SIZE;
  }

  // Client-side filtering to exclude existing media IDs (more reliable than SQL NOT IN)
  const filteredData = allRows.filter((game: MediaItemRow) => {
    if (existingMediaIds.has(game.id)) {
      return false;
    }

    const identitySource = game.igdb_slug || game.title || '';
    if (!identitySource) {
      return true;
    }

    const baseIdentityKey = normalizeGameIdentityKey(identitySource);
    return !ownedGameIdentityKeys.has(baseIdentityKey);
  });

  const gameIds = filteredData.map((g: MediaItemRow) => g.id);
  const popularityMap = await loadPopularityScores(supabase, gameIds);

  return filteredData.map((row: MediaItemRow) => ({
    id: row.id,
    title: row.title ?? 'Untitled',
    coverImageLarge:
      row.cover_url_big ??
      row.cover_image_large ??
      row.cover_url_thumb ??
      row.cover_image_medium ??
      undefined,
    coverImageMedium: row.cover_url_thumb ?? row.cover_image_medium ?? undefined,
    slug: row.igdb_slug || titleToSlug(row.title ?? 'untitled'),
    genres: row.genres || [],
    themes: row.igdb_themes || [],
    platforms: row.platforms || [],
    popularityScore: popularityMap.get(row.id) ?? 0,
  }));
}

/**
 * Load popularity scores
 */
async function loadPopularityScores(
  supabase: SupabaseClient,
  mediaIds: number[],
): Promise<Map<number, number>> {
  if (mediaIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('user_media_entries')
    .select('media_id, status, is_favorite, score')
    .in('media_id', mediaIds);

  if (error) {
    console.error('[GameRecommenderV2] Error loading popularity:', error);
    return new Map();
  }

  const stats = new Map<number, { tracked: number; completed: number; favorites: number }>();

  for (const row of data || []) {
    const mediaId = row.media_id;
    const current = stats.get(mediaId) ?? { tracked: 0, completed: 0, favorites: 0 };

    current.tracked += 1;
    if (row.status === 'completed') {
      current.completed += 1;
    }
    if (row.is_favorite) {
      current.favorites += 1;
    }

    stats.set(mediaId, current);
  }

  const popularityScores = new Map<number, number>();

  for (const [mediaId, stat] of stats.entries()) {
    if (stat.tracked < MIN_POPULARITY) {
      continue;
    }

    const trackedScore = Math.min(50, (stat.tracked / 20) * 50);
    const completionRate = stat.completed / stat.tracked;
    const favoriteRate = stat.favorites / stat.tracked;

    const score = trackedScore + completionRate * 30 + favoriteRate * 20;
    popularityScores.set(mediaId, Math.min(100, score));
  }

  return popularityScores;
}

/**
 * Convert title to slug
 */
function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Normalize game title/slug to a base identity key so edition variants collapse together.
 */
function normalizeGameIdentityKey(value: string): string {
  const original = titleToSlug(value);
  if (!original) {
    return '';
  }

  let normalized = normalizeSequelNumberTokens(normalizePossessiveTokens(original));

  // Remove common suffixes that usually indicate the same base game in a different edition.
  let previous = '';
  while (normalized && normalized !== previous) {
    previous = normalized;
    normalized = normalized
      .replace(/-(?:game-of-the-year(?:-edition)?|goty(?:-edition)?)$/, '')
      .replace(/-(?:director-s-cut|directors-cut)$/, '')
      .replace(/-(?:definitive|complete|enhanced|ultimate|deluxe|gold|anniversary|standard)-edition$/, '')
      .replace(/-(?:hd-remaster(?:ed)?|remaster(?:ed)?|remake)$/, '')
      .replace(/-(?:definitive|complete|enhanced|ultimate|deluxe|gold|anniversary|standard|edition)$/, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  return normalized || original;
}

function normalizeSequelNumberTokens(value: string): string {
  const romanToArabic = new Map<string, string>([
    ['i', '1'],
    ['ii', '2'],
    ['iii', '3'],
    ['iv', '4'],
    ['v', '5'],
    ['vi', '6'],
    ['vii', '7'],
    ['viii', '8'],
    ['ix', '9'],
    ['x', '10'],
    ['xi', '11'],
    ['xii', '12'],
    ['xiii', '13'],
    ['xiv', '14'],
    ['xv', '15'],
    ['xvi', '16'],
    ['xvii', '17'],
    ['xviii', '18'],
    ['xix', '19'],
    ['xx', '20'],
  ]);

  const tokens = value.split('-').map(token => {
    const roman = romanToArabic.get(token);
    if (roman) {
      return roman;
    }

    if (/^\d+$/.test(token)) {
      return String(parseInt(token, 10));
    }

    return token;
  });

  return tokens.join('-');
}

function normalizePossessiveTokens(value: string): string {
  const tokens = value.split('-');
  const normalized: string[] = [];

  for (const token of tokens) {
    if (token === 's' && normalized.length > 0) {
      normalized[normalized.length - 1] = `${normalized[normalized.length - 1]}s`;
      continue;
    }
    normalized.push(token);
  }

  return normalized.join('-');
}
