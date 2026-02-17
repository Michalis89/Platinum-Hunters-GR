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
export async function generateGameRecommendationsV2(userId: string): Promise<Recommendation[]> {
  const supabase = await createRouteHandlerClient();

  // Load genre coverage first (for generic detection)
  const coverageMap = await calculateGenreCoverage(supabase, 'games');

  // Load user data
  const [genreAffinities, mediaHistory, categoryProfile] = await Promise.all([
    loadUserGenreAffinities(supabase, userId),
    loadUserMediaHistory(supabase, userId),
    loadUserCategoryProfile(supabase, userId),
  ]);

  // Extract platform preferences
  const favoritePlatform = categoryProfile?.games?.favorite_platform ?? null;
  const secondFavoritePlatform = null; // TODO: Add to profile

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
  const numFromBacklog = Math.min(scoredBacklog.length, RECOMMENDATION_LIMITS.BACKLOG);
  const numFromDatabase =
    numFromBacklog < RECOMMENDATION_LIMITS.BACKLOG
      ? RECOMMENDATION_LIMITS.DATABASE_FALLBACK - numFromBacklog
      : RECOMMENDATION_LIMITS.DATABASE;

  // Get backlog recommendations
  const backlogRecommendations = scoredBacklog.slice(0, numFromBacklog).map(item => ({
    mediaId: item.entry.mediaId,
    category: 'games' as const,
    title: item.entry.media.title,
    cover: item.entry.media.coverImageLarge || item.entry.media.coverImageMedium || '',
    slug: titleToSlug(item.entry.media.title),
    reason: item.reason,
    confidence: 1.0,
    source: 'backlog' as const,
    genres: item.entry.media.genres,
    tags: [],
    primaryGenre: item.entry.media.genres[0],
    score: item.finalScore,
  }));

  // Load and score database games
  const existingMediaIds = new Set(mediaHistory.map(e => e.mediaId));
  const databaseGames = await loadDatabaseGames(supabase, existingMediaIds, numFromDatabase * 10);

  const scoredDatabase = scoreDatabaseGames(databaseGames, preferences, coverageMap);

  const databaseRecommendations = scoredDatabase.slice(0, numFromDatabase).map(item => ({
    mediaId: item.mediaId,
    category: 'games' as const,
    title: item.title,
    cover: item.cover,
    slug: item.slug,
    reason: item.matchReason,
    confidence: Math.min(0.95, item.finalScore / 100),
    source: 'database' as const,
    genres: item.genres,
    tags: [],
    primaryGenre: item.primaryGenre,
    score: item.finalScore,
  }));

  const recommendations = [...backlogRecommendations, ...databaseRecommendations];

  return recommendations;
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
        cover_image_large,
        cover_image_medium
      )
    `,
    )
    .eq('media_items.category', 'games')
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
      coverImageLarge: row.media_items.cover_image_large ?? undefined,
      coverImageMedium: row.media_items.cover_image_medium ?? undefined,
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
    .single();

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
  limit: number,
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
  const notInClause = existingMediaIds.size > 0 ? Array.from(existingMediaIds) : null;

  let query = supabase
    .from('media_items')
    .select(
      `
      id,
      title,
      igdb_slug,
      genres,
      igdb_themes,
      platforms,
      cover_image_large,
      cover_image_medium
    `,
    )
    .in('category', ['games', 'game'])
    .order('id', { ascending: false })
    .limit(limit);

  if (notInClause) {
    query = query.not('id', 'in', `(${notInClause.join(',')})`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[GameRecommenderV2] Error loading database games:', error);
    return [];
  }

  const gameIds = (data || []).map((g: MediaItemRow) => g.id);
  const popularityMap = await loadPopularityScores(supabase, gameIds);

  return (data || []).map((row: MediaItemRow) => ({
    id: row.id,
    title: row.title ?? 'Untitled',
    coverImageLarge: row.cover_image_large ?? undefined,
    coverImageMedium: row.cover_image_medium ?? undefined,
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
