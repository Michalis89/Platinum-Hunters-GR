/**
 * Generic Recommender
 *
 * Simple recommendation system for anime, manga, movies, tv, books
 * Simpler than games - no generic detection, straightforward scoring
 */

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { buildUserPreferences } from '../core/preference-analyzer';
import { getCanonicalKey } from '../../core/genre-normalization';
import { RECOMMENDATION_LIMITS, MIN_POPULARITY, getPriorityTier } from '../core/scoring-engine';
import type {
  Recommendation,
  UserGenreAffinity,
  UserMediaEntry,
  RecommendationCategory,
  UserPreferences,
} from '../types';

type SupabaseClient = Awaited<ReturnType<typeof createRouteHandlerClient>>;

/**
 * Database query result types (matching Supabase nullability)
 */
type UserMediaEntryRow = {
  id: number;
  media_id: number;
  status: string;
  score: number | null;
  progress: number | null;
  priority: number | null;
  is_favorite: boolean | null;
  pinned_rank: number | null;
  updated_at: string | null;
  media_items: {
    id: number;
    title_english?: string | null;
    title_romaji?: string | null;
    title_native?: string | null;
    title?: string | null;
    category: string | null;
    genres: string[] | null;
    cover_image_large: string | null;
    cover_image_medium: string | null;
  };
};

type MediaItemRow = {
  id: number;
  title_english?: string | null;
  title_romaji?: string | null;
  title_native?: string | null;
  title?: string | null;
  genres: string[] | null;
  cover_image_large: string | null;
  cover_image_medium: string | null;
};

/**
 * Generate recommendations for non-game categories
 */
export async function generateGenericRecommendations(
  userId: string,
  category: Exclude<RecommendationCategory, 'games'>,
): Promise<Recommendation[]> {
  const supabase = await createRouteHandlerClient();

  // Load user data
  const [genreAffinities, mediaHistory] = await Promise.all([
    loadUserGenreAffinities(supabase, userId, category),
    loadUserMediaHistory(supabase, userId, category),
  ]);

  // Build preferences (simpler than games)
  const preferences = buildUserPreferences(genreAffinities, mediaHistory, null, null);

  // Score backlog
  const backlogEntries = mediaHistory.filter(e => e.status === 'planned');
  const scoredBacklog = scoreBacklogItems(backlogEntries, preferences);

  // Determine split
  const numFromBacklog = Math.min(scoredBacklog.length, RECOMMENDATION_LIMITS.BACKLOG);
  const numFromDatabase =
    numFromBacklog < RECOMMENDATION_LIMITS.BACKLOG
      ? RECOMMENDATION_LIMITS.DATABASE_FALLBACK - numFromBacklog
      : RECOMMENDATION_LIMITS.DATABASE;

  // Get backlog recommendations
  const backlogRecommendations = scoredBacklog.slice(0, numFromBacklog).map(item => ({
    mediaId: item.entry.mediaId,
    category,
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

  // Load and score database items
  const existingMediaIds = new Set(mediaHistory.map(e => e.mediaId));
  const databaseItems = await loadDatabaseItems(
    supabase,
    category,
    existingMediaIds,
    numFromDatabase * 10,
  );

  const scoredDatabase = scoreDatabaseItems(databaseItems, preferences);

  const databaseRecommendations = scoredDatabase.slice(0, numFromDatabase).map(item => ({
    mediaId: item.mediaId,
    category,
    title: item.title,
    cover: item.cover,
    slug: item.slug,
    reason: item.reason,
    confidence: Math.min(0.95, item.score / 100),
    source: 'database' as const,
    genres: item.genres,
    tags: [],
    primaryGenre: item.primaryGenre,
    score: item.score,
  }));

  const recommendations = [...backlogRecommendations, ...databaseRecommendations];

  return recommendations;
}

/**
 * Score backlog items
 */
function scoreBacklogItems(
  backlogEntries: UserMediaEntry[],
  preferences: UserPreferences,
): Array<{
  entry: UserMediaEntry;
  finalScore: number;
  reason: string;
}> {
  const scoredItems = backlogEntries.map(entry => {
    const genreScore = calculateGenreScore(entry.media.genres, preferences);
    const priorityTier = getPriorityTier(entry.priority);

    let finalScore = genreScore;

    // Simple priority boost
    if (entry.priority && entry.priority >= 80) {
      finalScore *= 1.2;
    }

    const reason = generateBacklogReason(entry, genreScore);

    return {
      entry,
      finalScore,
      reason,
      priorityTier,
    };
  });

  // Sort by priority tier first, then score
  const tierOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return scoredItems.sort((a, b) => {
    const tierDiff = tierOrder[a.priorityTier] - tierOrder[b.priorityTier];
    if (tierDiff !== 0) {
      return tierDiff;
    }
    return b.finalScore - a.finalScore;
  });
}

/**
 * Score database items
 */
function scoreDatabaseItems(
  items: Array<{
    id: number;
    title: string;
    coverImageLarge?: string;
    coverImageMedium?: string;
    slug: string;
    genres: string[];
    popularityScore: number;
  }>,
  preferences: UserPreferences,
): Array<{
  mediaId: number;
  title: string;
  cover: string;
  slug: string;
  genres: string[];
  primaryGenre: string;
  score: number;
  reason: string;
}> {
  const MIN_GENRE_AFFINITY = 30.0;

  // Filter by minimum affinity
  const candidates = items.filter(item =>
    item.genres.some(g => {
      const canonicalKey = getCanonicalKey(g);
      if (!canonicalKey) {
        return false;
      }
      return (preferences.genreAffinities.get(canonicalKey)?.score ?? 0) >= MIN_GENRE_AFFINITY;
    }),
  );

  // Score each
  const scored = candidates.map(item => {
    const genreScore = calculateGenreScore(item.genres, preferences);

    // Apply popularity boost
    let finalScore = genreScore;
    if (item.popularityScore > 0) {
      const popularityBoost = 1 + Math.min(0.15, item.popularityScore / 100);
      finalScore *= popularityBoost;
    }

    // Apply avoided genre penalty (simple)
    const hasAvoidedGenre = item.genres.some(g => {
      const canonicalKey = getCanonicalKey(g);
      if (!canonicalKey) {
        return false;
      }
      return preferences.avoidedGenres.has(canonicalKey);
    });

    if (hasAvoidedGenre) {
      finalScore *= 0.7; // Simple 30% penalty
    }

    const primaryGenre = getCanonicalKey(item.genres[0]) ?? item.genres[0];
    const reason = generateDatabaseReason(item.genres, genreScore, preferences);

    return {
      mediaId: item.id,
      title: item.title,
      cover: item.coverImageLarge || item.coverImageMedium || '',
      slug: item.slug,
      genres: item.genres,
      primaryGenre,
      score: finalScore,
      reason,
    };
  });

  // Sort by score
  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Calculate simple genre score
 */
function calculateGenreScore(genres: string[], preferences: UserPreferences): number {
  if (genres.length === 0) {
    return 0;
  }

  let totalScore = 0;
  let totalWeight = 0;

  const weights = [0.6, 0.3, 0.1]; // Primary, secondary, tertiary

  for (let i = 0; i < Math.min(genres.length, 3); i++) {
    const genre = genres[i];
    const canonicalKey = getCanonicalKey(genre);
    if (!canonicalKey) {
      continue;
    }

    const affinity = preferences.genreAffinities.get(canonicalKey)?.score ?? 0;
    if (affinity === 0) {
      continue;
    }

    const weight = weights[i];
    totalScore += affinity * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

/**
 * Generate backlog reason
 */
function generateBacklogReason(entry: UserMediaEntry, genreScore: number): string {
  if (entry.priority && entry.priority >= 80) {
    return 'High priority in your backlog';
  }

  if (genreScore >= 80) {
    const primaryGenre = entry.media.genres[0];
    return `Perfect ${primaryGenre} match from your backlog`;
  }

  if (entry.media.genres.length >= 2) {
    const topGenres = entry.media.genres.slice(0, 2).join(' & ');
    return `${topGenres} - matches your taste`;
  }

  return 'Ready to start from your backlog';
}

/**
 * Generate database reason
 */
function generateDatabaseReason(
  genres: string[],
  genreScore: number,
  preferences: UserPreferences,
): string {
  const matchedGenres = genres.filter(g => {
    const canonicalKey = getCanonicalKey(g);
    if (!canonicalKey) {
      return false;
    }
    return (preferences.genreAffinities.get(canonicalKey)?.score ?? 0) > 0;
  });

  if (matchedGenres.length === 1 && genreScore >= 80) {
    return `Perfect ${matchedGenres[0]} match`;
  }

  if (matchedGenres.length >= 2) {
    const topGenres = matchedGenres.slice(0, 2).join(' & ');
    return `Combines ${topGenres} - your favorite genres`;
  }

  return 'Strong match based on your preferences';
}

/**
 * Load user genre affinities
 */
async function loadUserGenreAffinities(
  supabase: SupabaseClient,
  userId: string,
  category: string,
): Promise<UserGenreAffinity[]> {
  const { data, error } = await supabase
    .from('user_genre_affinity')
    .select('genre, score, item_count, strong_signal_count')
    .eq('user_id', userId)
    .eq('category', category)
    .order('score', { ascending: false });

  if (error) {
    console.error(`[GenericRecommender] Error loading genre affinities for ${category}:`, error);
    return [];
  }

  return (data || []).map(row => ({
    genre: row.genre,
    score: parseFloat(String(row.score)),
    itemCount: row.item_count,
    strongSignalCount: row.strong_signal_count,
    signalRatio: 0,
  }));
}

/**
 * Load user media history
 */
async function loadUserMediaHistory(
  supabase: SupabaseClient,
  userId: string,
  category: string,
): Promise<UserMediaEntry[]> {
  // Anime/manga use different title fields
  const titleFields =
    category === 'anime' || category === 'manga'
      ? 'title_english, title_romaji, title_native'
      : 'title';

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
        ${titleFields},
        category,
        genres,
        cover_image_large,
        cover_image_medium
      )
    `,
    )
    .eq('media_items.category', category)
    .eq('user_id', userId);

  if (error) {
    console.error(`[GenericRecommender] Error loading media history for ${category}:`, error);
    return [];
  }

  return (data || []).map((row: UserMediaEntryRow) => {
    // Get title based on category
    const itemTitle =
      category === 'anime' || category === 'manga'
        ? row.media_items.title_english ||
          row.media_items.title_romaji ||
          row.media_items.title_native ||
          'Untitled'
        : row.media_items.title || 'Untitled';

    return {
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
        title: itemTitle,
        category: row.media_items.category ?? category,
        genres: row.media_items.genres || [],
        themes: [],
        platforms: [],
        coverImageLarge: row.media_items.cover_image_large ?? undefined,
        coverImageMedium: row.media_items.cover_image_medium ?? undefined,
      },
    };
  });
}

/**
 * Load database items
 */
async function loadDatabaseItems(
  supabase: SupabaseClient,
  category: string,
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
    popularityScore: number;
  }>
> {
  const notInClause = existingMediaIds.size > 0 ? Array.from(existingMediaIds) : null;

  // Anime/manga use different title fields, other categories use 'title'
  let data, error;
  if (category === 'anime' || category === 'manga') {
    let query = supabase
      .from('media_items')
      .select(
        'id, title_english, title_romaji, title_native, genres, cover_image_large, cover_image_medium',
      )
      .eq('category', category)
      .order('id', { ascending: false })
      .limit(limit);

    if (notInClause) {
      query = query.not('id', 'in', `(${notInClause.join(',')})`);
    }

    const result = await query;
    data = result.data;
    error = result.error;
  } else {
    let query = supabase
      .from('media_items')
      .select('id, title, genres, cover_image_large, cover_image_medium')
      .eq('category', category)
      .order('id', { ascending: false })
      .limit(limit);

    if (notInClause) {
      query = query.not('id', 'in', `(${notInClause.join(',')})`);
    }

    const result = await query;
    data = result.data;
    error = result.error;
  }

  if (error) {
    console.error(`[GenericRecommender] Error loading database items for ${category}:`, error);
    return [];
  }

  const itemIds = (data || []).map((item: MediaItemRow) => item.id);
  const popularityMap = await loadPopularityScores(supabase, itemIds);

  return (data || []).map((row: MediaItemRow) => {
    // Get title based on category
    const itemTitle =
      category === 'anime' || category === 'manga'
        ? row.title_english || row.title_romaji || row.title_native || 'Untitled'
        : row.title || 'Untitled';

    return {
      id: row.id,
      title: itemTitle,
      coverImageLarge: row.cover_image_large ?? undefined,
      coverImageMedium: row.cover_image_medium ?? undefined,
      slug: titleToSlug(itemTitle),
      genres: row.genres || [],
      popularityScore: popularityMap.get(row.id) ?? 0,
    };
  });
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
    .select('media_id, status, is_favorite')
    .in('media_id', mediaIds);

  if (error) {
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
function titleToSlug(title: string | null | undefined): string {
  if (!title) {
    return 'untitled';
  }
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
