import type { createRouteHandlerClient } from '@/lib/supabase-route-handler';

// ─── Types ───────────────────────────────────────────────────────────────────

type AffinityCategory = 'games' | 'anime' | 'manga' | 'books' | 'movies' | 'tv';

type AffinityEntry = {
  status: string;
  score: number | null;
  is_favorite: boolean | null;
  genres: string[];
  category: string;
};

type GenreScore = {
  genre: string;
  score: number;
  itemCount: number;
  strongSignalCount: number;
};

type GenreAffinityResult = Partial<Record<AffinityCategory, GenreScore[]>>;

// ─── Constants ───────────────────────────────────────────────────────────────

const AFFINITY_CATEGORIES: AffinityCategory[] = [
  'games', 'anime', 'manga', 'books', 'movies', 'tv',
];

const STATUS_WEIGHT = {
  completed: 1.5,
  current: 1.0,
  planned: 0.2,
} as const;

const FAVORITE_BONUS = 3.0;

const DROPPED_WEIGHT = {
  NO_RATING: -0.2,
  LOW_RATING: -1.0,   // rating <= 5
  HIGH_RATING: 0,      // rating >= 7
} as const;

const RATING_BOOST = {
  HIGH: 0.8,   // 8–10
  MEDIUM: 0.3, // 6–7
} as const;

const MIN_ITEMS_DEFAULT = 2;
const SMALL_LIBRARY_THRESHOLD = 10;
const TOP_GENRES_LIMIT = 8;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeGenreKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function getBaseWeight(status: string, score: number | null): number {
  if (status === 'dropped') {
    if (score === null || score === undefined) {return DROPPED_WEIGHT.NO_RATING;}
    if (score <= 5) {return DROPPED_WEIGHT.LOW_RATING;}
    if (score >= 7) {return DROPPED_WEIGHT.HIGH_RATING;}
    // 5 < score < 7 (e.g. 6): treat as no-rating dropped
    return DROPPED_WEIGHT.NO_RATING;
  }

  return STATUS_WEIGHT[status as keyof typeof STATUS_WEIGHT] ?? 0;
}

function getRatingBoost(score: number | null): number {
  if (score === null || score === undefined) {return 0;}
  if (score >= 8) {return RATING_BOOST.HIGH;}
  if (score >= 6) {return RATING_BOOST.MEDIUM;}
  return 0;
}

function getFavoriteBonus(isFavorite: boolean | null): number {
  return isFavorite ? FAVORITE_BONUS : 0;
}

function isStrongSignal(
  entry: AffinityEntry,
): boolean {
  if (entry.is_favorite) {return true;}
  if (entry.status === 'completed') {return true;}
  return false;
}

function hasHighRatingCompleted(entry: AffinityEntry): boolean {
  return (
    entry.status === 'completed' &&
    typeof entry.score === 'number' &&
    entry.score >= 8
  );
}

// ─── Core Algorithm ──────────────────────────────────────────────────────────

export function computeGenreAffinity(entries: AffinityEntry[]): GenreAffinityResult {
  // Group entries by category
  const byCategory = new Map<AffinityCategory, AffinityEntry[]>();

  for (const entry of entries) {
    const cat = entry.category as AffinityCategory;
    if (!AFFINITY_CATEGORIES.includes(cat)) {continue;}
    if (!entry.genres || entry.genres.length === 0) {continue;}

    const list = byCategory.get(cat) ?? [];
    list.push(entry);
    byCategory.set(cat, list);
  }

  const result: GenreAffinityResult = {};

  for (const category of AFFINITY_CATEGORIES) {
    const categoryEntries = byCategory.get(category);
    if (!categoryEntries || categoryEntries.length === 0) {
      continue;
    }

    const totalItemsInCategory = categoryEntries.length;
    const isSmallLibrary = totalItemsInCategory < SMALL_LIBRARY_THRESHOLD;

    // Accumulate genre stats
    const genreMap = new Map<
      string,
      {
        label: string;
        score: number;
        itemCount: number;
        strongSignalCount: number;
        favoriteCount: number;
        completedCount: number;
        highRatingCompletedCount: number;
      }
    >();

    for (const entry of categoryEntries) {
      const baseWeight = getBaseWeight(entry.status, entry.score);
      const ratingBoost = getRatingBoost(entry.score);
      const favoriteBonus = getFavoriteBonus(entry.is_favorite);
      const totalWeight = baseWeight + ratingBoost + favoriteBonus;

      // Multi-genre balancing: distribute weight using sqrt
      const genreCount = entry.genres.length;
      const weightPerGenre = totalWeight / Math.sqrt(genreCount);

      const strong = isStrongSignal(entry);
      const highRatedCompleted = hasHighRatingCompleted(entry);

      for (const rawGenre of entry.genres) {
        const label = rawGenre.trim();
        if (!label) {continue;}

        const key = normalizeGenreKey(label);
        const current = genreMap.get(key) ?? {
          label,
          score: 0,
          itemCount: 0,
          strongSignalCount: 0,
          favoriteCount: 0,
          completedCount: 0,
          highRatingCompletedCount: 0,
        };

        current.score += weightPerGenre;
        current.itemCount += 1;
        if (strong) {current.strongSignalCount += 1;}
        if (entry.is_favorite) {current.favoriteCount += 1;}
        if (entry.status === 'completed') {current.completedCount += 1;}
        if (highRatedCompleted) {current.highRatingCompletedCount += 1;}

        genreMap.set(key, current);
      }
    }

    // Apply minimum evidence rule & clamp scores
    const qualified: GenreScore[] = [];

    for (const stats of genreMap.values()) {
      // Clamp to minimum 0
      const clampedScore = Math.max(0, stats.score);
      if (clampedScore === 0) {continue;}

      // Check minimum evidence
      const meetsEvidence = isSmallLibrary
        ? meetsSmallLibraryEvidence(stats)
        : meetsDefaultEvidence(stats);

      if (!meetsEvidence) {continue;}

      qualified.push({
        genre: stats.label,
        score: Math.round(clampedScore * 100) / 100,
        itemCount: stats.itemCount,
        strongSignalCount: stats.strongSignalCount,
      });
    }

    // Sort descending by score, then by item count, then alphabetically
    qualified.sort((a, b) => {
      if (b.score !== a.score) {return b.score - a.score;}
      if (b.itemCount !== a.itemCount) {return b.itemCount - a.itemCount;}
      return a.genre.localeCompare(b.genre);
    });

    if (qualified.length > 0) {
      result[category] = qualified.slice(0, TOP_GENRES_LIMIT);
    }
  }

  return result;
}

// ─── Evidence Rules ──────────────────────────────────────────────────────────

function meetsDefaultEvidence(stats: {
  itemCount: number;
  favoriteCount: number;
  completedCount: number;
  highRatingCompletedCount: number;
}): boolean {
  if (stats.itemCount < MIN_ITEMS_DEFAULT) {return false;}

  // At least 1 strong signal:
  // 1 favorite OR 2 completed OR 1 completed + rating >= 8
  const hasFavorite = stats.favoriteCount >= 1;
  const hasTwoCompleted = stats.completedCount >= 2;
  const hasHighRatedCompleted = stats.highRatingCompletedCount >= 1;

  return hasFavorite || hasTwoCompleted || hasHighRatedCompleted;
}

function meetsSmallLibraryEvidence(stats: {
  itemCount: number;
  favoriteCount: number;
  completedCount: number;
  highRatingCompletedCount: number;
  score: number;
}): boolean {
  // Relaxed: 1 item is enough BUT only if favorite or rating >= 9
  // We check favoriteCount (direct) or highRatingCompletedCount as proxy
  // Note: for rating >= 9 specifically, we rely on the score being high enough
  if (stats.itemCount >= MIN_ITEMS_DEFAULT) {
    return meetsDefaultEvidence(stats);
  }

  // 1 item: must be favorite or have a very high-rated completed
  return stats.favoriteCount >= 1 || stats.highRatingCompletedCount >= 1;
}

// ─── Supabase Integration ────────────────────────────────────────────────────

type SupabaseClient = Awaited<ReturnType<typeof createRouteHandlerClient>>;

export async function fetchEntriesForAffinity(
  supabase: SupabaseClient,
  userId: string,
): Promise<AffinityEntry[]> {
  const { data, error } = await supabase
    .from('user_media_entries')
    .select('status,score,is_favorite,media_items!inner(category,genres)')
    .eq('user_id', userId)
    .in('media_items.category', AFFINITY_CATEGORIES);

  if (error || !data) {return [];}

  const entries: AffinityEntry[] = [];

  for (const row of data as Array<Record<string, unknown>>) {
    const mediaRaw = row.media_items as unknown;
    const media = Array.isArray(mediaRaw)
      ? (mediaRaw[0] as Record<string, unknown> | undefined)
      : (mediaRaw as Record<string, unknown> | null | undefined);

    if (!media) {continue;}

    const category = media.category;
    if (typeof category !== 'string') {continue;}

    const genres = Array.isArray(media.genres)
      ? (media.genres as string[]).filter((g): g is string => typeof g === 'string')
      : [];

    entries.push({
      status: typeof row.status === 'string' ? row.status : '',
      score: typeof row.score === 'number' ? row.score : null,
      is_favorite: typeof row.is_favorite === 'boolean' ? row.is_favorite : false,
      genres,
      category,
    });
  }

  return entries;
}

export async function storeGenreAffinity(
  supabase: SupabaseClient,
  userId: string,
  affinity: GenreAffinityResult,
): Promise<void> {
  // Delete existing affinity rows for this user
  await supabase
    .from('user_genre_affinity')
    .delete()
    .eq('user_id', userId);

  // Build rows to insert
  const rows: Array<{
    user_id: string;
    category: string;
    genre: string;
    score: number;
    item_count: number;
    strong_signal_count: number;
  }> = [];

  for (const [category, genres] of Object.entries(affinity)) {
    if (!genres) {continue;}
    for (const g of genres) {
      rows.push({
        user_id: userId,
        category,
        genre: g.genre,
        score: g.score,
        item_count: g.itemCount,
        strong_signal_count: g.strongSignalCount,
      });
    }
  }

  if (rows.length > 0) {
    await supabase.from('user_genre_affinity').insert(rows);
  }
}

/**
 * Recomputes genre affinity for a user and stores it in user_genre_affinity.
 * Fire-and-forget friendly — safe to call with `void refreshGenreAffinity(...)`.
 */
export async function refreshGenreAffinity(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const entries = await fetchEntriesForAffinity(supabase, userId);
  const affinity = computeGenreAffinity(entries);
  await storeGenreAffinity(supabase, userId, affinity);
}

/**
 * Minimum percentage of the top genre's score a genre must reach to be
 * considered a "favorite". Genres below this threshold are filtered out.
 * E.g. 0.5 means a genre must have at least 50% of the top genre's score.
 */
const FAVORITE_THRESHOLD_RATIO = 0.5;

/**
 * Fetches all top genres from user_genre_affinity (up to 8 per category).
 * Returns genres ordered by score (highest first) with NO threshold filtering.
 *
 * This represents the user's **Top Genres** based on weighted volume.
 *
 * @returns Map like { games: ["RPG", "Action", ...], anime: ["Shounen", ...] }
 */
export async function fetchTopGenres(
  supabase: SupabaseClient,
  userId: string,
): Promise<Record<string, string[]>> {
  const { data, error } = await supabase
    .from('user_genre_affinity')
    .select('category,genre,score')
    .eq('user_id', userId)
    .order('score', { ascending: false });

  if (error || !data || data.length === 0) {
    return {};
  }

  // Group by category, keeping score order (already sorted desc)
  const grouped = new Map<string, Array<{ genre: string; score: number }>>();
  for (const row of data) {
    const list = grouped.get(row.category) ?? [];
    list.push({ genre: row.genre, score: row.score });
    grouped.set(row.category, list);
  }

  // Return all genres per category (up to TOP_GENRES_LIMIT)
  // Enforce limit at fetch-time for defensive programming / future-proofing
  const result: Record<string, string[]> = {};
  for (const [category, genres] of grouped) {
    if (genres.length > 0) {
      result[category] = genres.slice(0, TOP_GENRES_LIMIT).map(g => g.genre);
    }
  }

  return result;
}

/**
 * Fetches favorite genres from user_genre_affinity using threshold filtering.
 * Returns only genres scoring >= 50% of the top genre in their category.
 *
 * This represents the user's **Favorite Genres** (a more selective subset).
 *
 * @returns Map like { games: ["RPG", "Action"], anime: ["Shounen"] }
 */
export async function fetchFavoriteGenres(
  supabase: SupabaseClient,
  userId: string,
): Promise<Record<string, string[]>> {
  const { data, error } = await supabase
    .from('user_genre_affinity')
    .select('category,genre,score')
    .eq('user_id', userId)
    .order('score', { ascending: false });

  if (error || !data || data.length === 0) {
    return {};
  }

  // Group by category, keeping score order (already sorted desc)
  const grouped = new Map<string, Array<{ genre: string; score: number }>>();
  for (const row of data) {
    const list = grouped.get(row.category) ?? [];
    list.push({ genre: row.genre, score: row.score });
    grouped.set(row.category, list);
  }

  // Filter: only keep genres >= 50% of the top genre's score per category
  // Enforce TOP_GENRES_LIMIT first, then apply threshold filtering
  const result: Record<string, string[]> = {};
  for (const [category, genres] of grouped) {
    // Limit to top N genres per category (defensive / future-proof)
    const topGenres = genres.slice(0, TOP_GENRES_LIMIT);
    const topScore = topGenres[0]?.score ?? 0;
    if (topScore <= 0) {continue;}

    const threshold = topScore * FAVORITE_THRESHOLD_RATIO;
    const filtered = topGenres
      .filter(g => g.score >= threshold)
      .map(g => g.genre);

    if (filtered.length > 0) {
      result[category] = filtered;
    }
  }

  return result;
}

/**
 * @deprecated Use fetchFavoriteGenres() or fetchTopGenres() for semantic clarity.
 * This alias is kept for backward compatibility.
 */
export const fetchGenreAffinityMap = fetchFavoriteGenres;
