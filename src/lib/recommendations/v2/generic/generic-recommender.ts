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
const DATABASE_FETCH_PAGE_SIZE = 500;

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
    cover_url_big: string | null;
    cover_url_thumb: string | null;
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
  cover_url_big: string | null;
  cover_url_thumb: string | null;
  cover_image_large: string | null;
  cover_image_medium: string | null;
};

type BehaviorSignals = {
  completionRate: number;
  sequelTolerance: number;
  topGenres: string[];
};

type ScoredDatabaseItem = {
  mediaId: number;
  title: string;
  cover: string;
  slug: string;
  genres: string[];
  primaryGenre: string;
  score: number;
  reason: string;
  confidenceBase: number;
  franchiseKey: string;
  isContinuation: boolean;
};

/**
 * Generate recommendations for non-game categories
 */
export async function generateGenericRecommendations(
  userId: string,
  category: Exclude<RecommendationCategory, 'games'>,
): Promise<Recommendation[]> {
  return generateGenericRecommendationsWithLimits(userId, category);
}

type RecommendationLimitsOverride = {
  backlog?: number;
  database?: number;
  databaseFallback?: number;
  total?: number;
};

export async function generateGenericRecommendationsWithLimits(
  userId: string,
  category: Exclude<RecommendationCategory, 'games'>,
  limits?: RecommendationLimitsOverride,
): Promise<Recommendation[]> {
  const supabase = await createRouteHandlerClient();
  const maxBacklog = limits?.backlog ?? RECOMMENDATION_LIMITS.BACKLOG;
  const maxDatabase = limits?.database ?? RECOMMENDATION_LIMITS.DATABASE;
  const maxDatabaseFallback = limits?.databaseFallback ?? RECOMMENDATION_LIMITS.DATABASE_FALLBACK;
  const maxTotal = limits?.total ?? RECOMMENDATION_LIMITS.TOTAL;

  // Load user data
  const [genreAffinities, mediaHistory] = await Promise.all([
    loadUserGenreAffinities(supabase, userId, category),
    loadUserMediaHistory(supabase, userId, category),
  ]);

  // Build preferences (simpler than games)
  const preferences = buildUserPreferences(genreAffinities, mediaHistory, null, null);
  const engagedFranchiseKeys = buildEngagedFranchiseKeySet(mediaHistory);
  const behaviorSignals = buildBehaviorSignals(mediaHistory);

  // Score backlog
  const backlogEntries = mediaHistory.filter(e => e.status === 'planned');
  const scoredBacklog = scoreBacklogItems(
    backlogEntries,
    preferences,
    category,
    engagedFranchiseKeys,
  );

  // Determine split
  const numFromBacklog = Math.min(scoredBacklog.length, maxBacklog);
  const numFromDatabase =
    numFromBacklog < maxBacklog ? maxDatabaseFallback - numFromBacklog : maxDatabase;

  // Get backlog recommendations
  const selectedBacklog = selectUniqueBacklogByFranchise(scoredBacklog, numFromBacklog);
  const backlogRecommendations = selectedBacklog.map(item => ({
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
  const databaseItems = await loadDatabaseItems(supabase, category, existingMediaIds);

  const scoredDatabase = scoreDatabaseItems(
    databaseItems,
    preferences,
    category,
    engagedFranchiseKeys,
    behaviorSignals,
  );
  const scoredDatabasePrimary = selectDiverseDatabaseItems(scoredDatabase, numFromDatabase);

  let scoredDatabaseFinal = scoredDatabasePrimary;
  if (scoredDatabasePrimary.length < numFromDatabase) {
    const selectedIds = new Set(scoredDatabasePrimary.map(item => item.mediaId));
    const remainingItems = databaseItems.filter(item => !selectedIds.has(item.id));
    const fallbackScored = scoreDatabaseItems(
      remainingItems,
      preferences,
      category,
      engagedFranchiseKeys,
      behaviorSignals,
      0,
    );
    const needed = numFromDatabase - scoredDatabasePrimary.length;
    const fallbackSelected = selectDiverseDatabaseItems(
      fallbackScored.filter(item => !selectedIds.has(item.mediaId)),
      needed,
      new Set(scoredDatabasePrimary.map(item => item.franchiseKey)),
    );
    scoredDatabaseFinal = [...scoredDatabasePrimary, ...fallbackSelected];
  }

  const confidenceById = assignConfidenceSpread(scoredDatabaseFinal);
  const strictIds = new Set(scoredDatabasePrimary.map(item => item.mediaId));
  const databaseRecommendations = scoredDatabaseFinal.map(item => ({
    mediaId: item.mediaId,
    category,
    title: item.title,
    cover: item.cover,
    slug: item.slug,
    reason: item.reason,
    confidence: confidenceById.get(item.mediaId) ?? 0.6,
    source: strictIds.has(item.mediaId) ? ('database' as const) : ('database-fallback' as const),
    genres: item.genres,
    tags: [],
    primaryGenre: item.primaryGenre,
    score: item.score,
  }));

  const recommendations = [...backlogRecommendations, ...databaseRecommendations].slice(
    0,
    maxTotal,
  );

  return recommendations;
}

/**
 * Score backlog items
 */
function scoreBacklogItems(
  backlogEntries: UserMediaEntry[],
  preferences: UserPreferences,
  category: Exclude<RecommendationCategory, 'games'>,
  engagedFranchiseKeys: Set<string>,
): Array<{
  entry: UserMediaEntry;
  finalScore: number;
  reason: string;
}> {
  const scoredItems = backlogEntries
    .filter(entry => isEligibleByFranchiseEntryPoint(entry.media.title, category, engagedFranchiseKeys))
    .map(entry => {
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
  category: Exclude<RecommendationCategory, 'games'>,
  engagedFranchiseKeys: Set<string>,
  behaviorSignals: BehaviorSignals,
  minGenreAffinity: number = 30.0,
): ScoredDatabaseItem[] {
  // Filter by minimum affinity
  const candidates = items.filter(
    item =>
      isEligibleByFranchiseEntryPoint(item.title, category, engagedFranchiseKeys) &&
      item.genres.some(g => {
        const canonicalKey = getCanonicalKey(g);
        if (!canonicalKey) {
          return false;
        }
        return (preferences.genreAffinities.get(canonicalKey)?.score ?? 0) >= minGenreAffinity;
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

    const matchedGenres = getMatchedGenres(item.genres, preferences);
    const franchiseKey = extractFranchiseBaseKey(item.title);
    const isContinuation = isLikelyContinuationTitle(item.title);
    const franchiseFamiliarity = engagedFranchiseKeys.has(franchiseKey) ? 1 : 0.55;
    const noveltyBalance =
      matchedGenres.length >= 2
        ? 1
        : matchedGenres.length === 1
          ? 0.85
          : item.genres.length > 0
            ? 0.6
            : 0.4;
    const completionLikelihood = Math.min(
      1,
      Math.max(
        0.35,
        behaviorSignals.completionRate * 0.7 +
          behaviorSignals.sequelTolerance * (isContinuation ? 0.3 : 0.15) +
          0.15,
      ),
    );
    const tasteFit = Math.min(1, Math.max(0, genreScore / 100));
    const confidenceBase =
      (tasteFit * 0.45 +
        completionLikelihood * 0.25 +
        noveltyBalance * 0.15 +
        franchiseFamiliarity * 0.15) *
      100;

    const primaryGenre = getCanonicalKey(item.genres[0]) ?? item.genres[0];
    const reason = generateDatabaseReason(
      item.genres,
      genreScore,
      preferences,
      behaviorSignals,
      isContinuation,
      engagedFranchiseKeys.has(franchiseKey),
    );

    return {
      mediaId: item.id,
      title: item.title,
      cover: item.coverImageLarge || item.coverImageMedium || '',
      slug: item.slug,
      genres: item.genres,
      primaryGenre,
      score: finalScore,
      reason,
      confidenceBase,
      franchiseKey,
      isContinuation,
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
  behaviorSignals: BehaviorSignals,
  isContinuation: boolean,
  hasFranchiseFamiliarity: boolean,
): string {
  const matchedGenres = getMatchedGenres(genres, preferences);

  if (matchedGenres.length === 1 && genreScore >= 80) {
    return `Perfect ${matchedGenres[0]} match`;
  }

  if (matchedGenres.length >= 2) {
    const topGenres = matchedGenres.slice(0, 2).join(' & ');
    if (isContinuation && hasFranchiseFamiliarity) {
      return `Strong continuation pick combining ${topGenres} with your long-form watch pattern`;
    }
    return `Matches your ${topGenres} taste profile`;
  }

  if (behaviorSignals.topGenres.length >= 2) {
    return `Fits your ${behaviorSignals.topGenres[0]} + ${behaviorSignals.topGenres[1]} preferences`;
  }

  return 'Strong match based on your preferences';
}

function getMatchedGenres(genres: string[], preferences: UserPreferences): string[] {
  return genres
    .map(genre => {
      const canonicalKey = getCanonicalKey(genre);
      const affinity = canonicalKey ? (preferences.genreAffinities.get(canonicalKey)?.score ?? 0) : 0;
      return { genre, affinity };
    })
    .filter(item => item.affinity > 0)
    .sort((a, b) => b.affinity - a.affinity)
    .map(item => item.genre);
}

function buildBehaviorSignals(mediaHistory: UserMediaEntry[]): BehaviorSignals {
  let completed = 0;
  let active = 0;
  let dropped = 0;
  let continuationEngagements = 0;
  const genreCounts = new Map<string, number>();

  for (const entry of mediaHistory) {
    if (entry.status === 'completed') {
      completed += 1;
      active += 1;
    } else if (entry.status === 'current') {
      active += 1;
    } else if (entry.status === 'dropped') {
      dropped += 1;
    }

    if ((entry.status === 'completed' || entry.status === 'current') && isLikelyContinuationTitle(entry.media.title)) {
      continuationEngagements += 1;
    }

    if (entry.status !== 'completed' && entry.status !== 'current') {
      continue;
    }
    for (const genre of entry.media.genres.slice(0, 3)) {
      const key = genre.trim();
      if (!key) {
        continue;
      }
      genreCounts.set(key, (genreCounts.get(key) ?? 0) + 1);
    }
  }

  const completionDenominator = completed + active + dropped;
  const completionRate = completionDenominator > 0 ? completed / completionDenominator : 0.5;
  const sequelTolerance = active > 0 ? continuationEngagements / active : 0;
  const topGenres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([genre]) => genre);

  return {
    completionRate: Math.min(1, Math.max(0, completionRate)),
    sequelTolerance: Math.min(1, Math.max(0, sequelTolerance)),
    topGenres,
  };
}

function selectUniqueBacklogByFranchise(
  scoredItems: Array<{
    entry: UserMediaEntry;
    finalScore: number;
    reason: string;
  }>,
  limit: number,
) {
  const selected: typeof scoredItems = [];
  const seenFranchises = new Set<string>();

  for (const item of scoredItems) {
    if (selected.length >= limit) {
      break;
    }
    const franchiseKey = extractFranchiseBaseKey(item.entry.media.title);
    if (franchiseKey && seenFranchises.has(franchiseKey)) {
      continue;
    }
    if (franchiseKey) {
      seenFranchises.add(franchiseKey);
    }
    selected.push(item);
  }

  return selected;
}

function selectDiverseDatabaseItems(
  scoredItems: ScoredDatabaseItem[],
  limit: number,
  initialSeenFranchises?: Set<string>,
): ScoredDatabaseItem[] {
  const selected: ScoredDatabaseItem[] = [];
  const seenFranchises = new Set(initialSeenFranchises ?? []);
  const remaining = [...scoredItems];

  while (remaining.length > 0 && selected.length < limit) {
    let bestIndex = -1;
    let bestAdjusted = -Infinity;

    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i];
      if (candidate.franchiseKey && seenFranchises.has(candidate.franchiseKey)) {
        continue;
      }

      let penalty = 0;
      for (const chosen of selected) {
        const overlap = calculateGenreOverlap(candidate.genres, chosen.genres);
        if (overlap >= 0.6) {
          penalty += 22;
        } else if (overlap >= 0.35) {
          penalty += 10;
        }
        if (candidate.primaryGenre === chosen.primaryGenre) {
          penalty += 8;
        }
      }

      const adjustedScore = candidate.score - penalty;
      if (adjustedScore > bestAdjusted) {
        bestAdjusted = adjustedScore;
        bestIndex = i;
      }
    }

    if (bestIndex === -1) {
      break;
    }

    const chosen = remaining.splice(bestIndex, 1)[0];
    selected.push(chosen);
    if (chosen.franchiseKey) {
      seenFranchises.add(chosen.franchiseKey);
    }
  }

  return selected;
}

function calculateGenreOverlap(left: string[], right: string[]): number {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }
  const leftSet = new Set(left.map(item => item.toLowerCase()));
  const rightSet = new Set(right.map(item => item.toLowerCase()));
  const intersection = Array.from(leftSet).filter(item => rightSet.has(item)).length;
  const union = new Set([...leftSet, ...rightSet]).size;
  return union > 0 ? intersection / union : 0;
}

function assignConfidenceSpread(items: ScoredDatabaseItem[]): Map<number, number> {
  const confidenceById = new Map<number, number>();
  if (items.length === 0) {
    return confidenceById;
  }

  const bands = [
    [0.9, 0.95],
    [0.8, 0.88],
    [0.7, 0.79],
    [0.6, 0.69],
    [0.52, 0.59],
  ] as const;

  const baseScores = items.map(item => item.confidenceBase);
  const minBase = Math.min(...baseScores);
  const maxBase = Math.max(...baseScores);
  const spread = maxBase - minBase;

  items.forEach((item, index) => {
    const [minBand, maxBand] = bands[Math.min(index, bands.length - 1)];
    const normalized = spread > 0 ? (item.confidenceBase - minBase) / spread : 0.5;
    const confidence = minBand + (maxBand - minBand) * normalized;
    confidenceById.set(item.mediaId, Math.max(minBand, Math.min(maxBand, confidence)));
  });

  return confidenceById;
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
        cover_url_big,
        cover_url_thumb,
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
        coverImageLarge:
          row.media_items.cover_url_big ??
          row.media_items.cover_image_large ??
          row.media_items.cover_url_thumb ??
          row.media_items.cover_image_medium ??
          undefined,
        coverImageMedium:
          row.media_items.cover_url_thumb ?? row.media_items.cover_image_medium ?? undefined,
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
  const allRows: MediaItemRow[] = [];
  let offset = 0;

  // Anime/manga use different title fields, other categories use 'title'
  if (category === 'anime' || category === 'manga') {
    while (true) {
      const { data, error } = await supabase
        .from('media_items')
        .select(
          'id, title_english, title_romaji, title_native, genres, cover_url_big, cover_url_thumb, cover_image_large, cover_image_medium',
        )
        .eq('category', category)
        .order('id', { ascending: false })
        .range(offset, offset + DATABASE_FETCH_PAGE_SIZE - 1);

      if (error) {
        console.error(`[GenericRecommender] Error loading database items for ${category}:`, error);
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
  } else {
    while (true) {
      const { data, error } = await supabase
        .from('media_items')
        .select(
          'id, title, genres, cover_url_big, cover_url_thumb, cover_image_large, cover_image_medium',
        )
        .eq('category', category)
        .order('id', { ascending: false })
        .range(offset, offset + DATABASE_FETCH_PAGE_SIZE - 1);

      if (error) {
        console.error(`[GenericRecommender] Error loading database items for ${category}:`, error);
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
  }

  const filteredRows = allRows.filter((item: MediaItemRow) => !existingMediaIds.has(item.id));
  const itemIds = filteredRows.map((item: MediaItemRow) => item.id);
  const popularityMap = await loadPopularityScores(supabase, itemIds);

  return filteredRows.map((row: MediaItemRow) => {
    // Get title based on category
    const itemTitle =
      category === 'anime' || category === 'manga'
        ? row.title_english || row.title_romaji || row.title_native || 'Untitled'
        : row.title || 'Untitled';

    return {
      id: row.id,
      title: itemTitle,
      coverImageLarge:
        row.cover_url_big ??
        row.cover_image_large ??
        row.cover_url_thumb ??
        row.cover_image_medium ??
        undefined,
      coverImageMedium: row.cover_url_thumb ?? row.cover_image_medium ?? undefined,
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

function getAnimeFranchiseOverrideKey(title: string): string | null {
  const normalized = title.toLowerCase();

  // Monogatari franchise has many installments that do not share a single root token
  // (Bakemonogatari, Nisemonogatari, Owarimonogatari, etc.), so use an explicit key.
  if (
    /\b(monogatari|bakemonogatari|nisemonogatari|nekomonogatari|kizumonogatari|hanamonogatari|tsukimonogatari|owarimonogatari|zoku owarimonogatari)\b/u.test(
      normalized,
    )
  ) {
    return 'monogatari';
  }

  return null;
}

function isMonogatariRootEntrypoint(title: string): boolean {
  const normalized = title.toLowerCase();
  return (
    /^\s*bakemonogatari\b/u.test(normalized) ||
    /\bmonogatari series:?\s*first season\b/u.test(normalized)
  );
}

function normalizeTitleForFranchise(title: string): string {
  let normalized = title.toLowerCase().trim();
  normalized = normalized
    .replace(/:\s+.+$/u, '')
    .replace(/\s+-\s+.+$/u, '')
    .replace(/\s+\.\s+.+$/u, '')
    .replace(/\bseason\s+\d+\b/giu, '')
    .replace(/\bpart\s+\d+\b/giu, '')
    .replace(/\bcour\s+\d+\b/giu, '')
    .replace(/\b(ova|ona|special|movie|arc|chapter|chapters)\b/giu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  normalized = normalized.replace(/\b\d+\b$/u, '').trim();
  return normalized;
}

function extractFranchiseBaseKey(title: string): string {
  const overrideKey = getAnimeFranchiseOverrideKey(title);
  if (overrideKey) {
    return overrideKey;
  }

  const normalized = title.toLowerCase().trim();
  const splitByDelimiter = normalized.split(/[:]| - | \. /u)[0]?.trim() ?? normalized;
  const key = normalizeTitleForFranchise(splitByDelimiter);
  return key.length >= 3 ? key : normalizeTitleForFranchise(title);
}

function isLikelyContinuationTitle(title: string): boolean {
  const normalized = title.toLowerCase();
  const franchiseKey = extractFranchiseBaseKey(title);

  if (franchiseKey === 'monogatari' && !isMonogatariRootEntrypoint(title)) {
    return true;
  }

  if (/\bseason\b/u.test(normalized) && !/\bseason\s+1\b/u.test(normalized)) {
    return true;
  }

  const seasonMatch = normalized.match(/\bseason\s+(\d+)\b/u);
  if (seasonMatch && Number.parseInt(seasonMatch[1], 10) >= 2) {
    return true;
  }
  const partMatch = normalized.match(/\bpart\s+(\d+)\b/u);
  if (partMatch && Number.parseInt(partMatch[1], 10) >= 2) {
    return true;
  }
  return (
    /\bfinal season\b/u.test(normalized) ||
    /\bfinal chapters?\b/u.test(normalized) ||
    /\bsecond half\b/u.test(normalized) ||
    /\barc\b/u.test(normalized) ||
    /\bova\b/u.test(normalized) ||
    /\bona\b/u.test(normalized) ||
    /\bspecial\b/u.test(normalized) ||
    /\bmovie\b/u.test(normalized)
  );
}

function buildEngagedFranchiseKeySet(mediaHistory: UserMediaEntry[]): Set<string> {
  const keys = new Set<string>();
  for (const entry of mediaHistory) {
    if (entry.status !== 'current' && entry.status !== 'completed') {
      continue;
    }
    const key = extractFranchiseBaseKey(entry.media.title);
    if (key) {
      keys.add(key);
    }
  }
  return keys;
}

function isEligibleByFranchiseEntryPoint(
  title: string,
  category: Exclude<RecommendationCategory, 'games'>,
  engagedFranchiseKeys: Set<string>,
): boolean {
  if (category !== 'anime' && category !== 'manga') {
    return true;
  }
  if (!isLikelyContinuationTitle(title)) {
    return true;
  }
  const franchiseBaseKey = extractFranchiseBaseKey(title);
  if (!franchiseBaseKey) {
    return true;
  }
  return engagedFranchiseKeys.has(franchiseBaseKey);
}

export const __private__ = {
  extractFranchiseBaseKey,
  isLikelyContinuationTitle,
  isEligibleByFranchiseEntryPoint,
};
