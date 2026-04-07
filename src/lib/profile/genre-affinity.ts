import type { createRouteHandlerClient } from '@/lib/supabase-route-handler';

type AffinityCategory = 'games' | 'anime' | 'manga' | 'books' | 'movies' | 'tv';

type AffinityEntry = {
  title: string | null;
  status: string;
  score: number | null;
  is_favorite: boolean | null;
  progress: number | null;
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

type GenreStats = {
  label: string;
  score: number;
  itemCount: number;
  strongSignalCount: number;
  favoriteCount: number;
  completedCount: number;
  highRatingCompletedCount: number;
};

const AFFINITY_CATEGORIES: AffinityCategory[] = [
  'games',
  'anime',
  'manga',
  'books',
  'movies',
  'tv',
];

const STATUS_WEIGHT = {
  completed: 1.5,
  current: 0.9,
  planned: 0.15,
} as const;

const FAVORITE_MULTIPLIER = 1.4;

const DROPPED_WEIGHT = {
  NO_RATING: -0.2,
  LOW_RATING: -1.0,
  HIGH_RATING: 0,
} as const;

const MIN_ITEMS_DEFAULT = 2;
const SMALL_LIBRARY_THRESHOLD = 10;
const TOP_GENRES_LIMIT = 8;

const ANIME_CURRENT_MAX_WITHOUT_SCORE = 0.75;
const ANIME_CURRENT_MAX_WITH_SCORE = 1.05;

const AFFINITY_DEBUG_ANIME = process.env.HB_DEBUG_AFFINITY_ANIME === '1';

const ANIME_WEAK_METADATA_GENRES = new Set([
  'adult cast',
  'award winning',
  'children',
  'josei',
  'kids',
  'school',
  'seinen',
  'shoujo',
  'shounen',
  'workplace',
]);

const ANIME_SECONDARY_GENRES = new Set([
  'isekai',
  'martial arts',
  'military',
  'parody',
  'reincarnation',
  'strategy game',
  'super power',
  'survival',
  'time travel',
  'urban fantasy',
]);

function normalizeGenreKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function getBaseWeight(status: string, score: number | null): number {
  if (status === 'dropped') {
    if (score === null || score === undefined) {
      return DROPPED_WEIGHT.NO_RATING;
    }
    if (score <= 5) {
      return DROPPED_WEIGHT.LOW_RATING;
    }
    if (score >= 7) {
      return DROPPED_WEIGHT.HIGH_RATING;
    }
    return DROPPED_WEIGHT.NO_RATING;
  }

  return STATUS_WEIGHT[status as keyof typeof STATUS_WEIGHT] ?? 0;
}

function getRatingMultiplier(score: number | null, status: string): number {
  if (score === null || score === undefined) {
    return 1;
  }

  if (status === 'dropped') {
    if (score <= 5) {
      return 1.25;
    }
    return 1;
  }

  if (score >= 9) {
    return 1.35;
  }
  if (score >= 8) {
    return 1.2;
  }
  if (score >= 6) {
    return 1.05;
  }
  if (score <= 5) {
    return 0.9;
  }

  return 1;
}

function getFavoriteMultiplier(isFavorite: boolean | null): number {
  return isFavorite ? FAVORITE_MULTIPLIER : 1;
}

function isStrongSignal(entry: AffinityEntry): boolean {
  if (entry.is_favorite) {
    return true;
  }
  if (entry.status === 'completed') {
    return true;
  }
  return false;
}

function hasHighRatingCompleted(entry: AffinityEntry): boolean {
  return entry.status === 'completed' && typeof entry.score === 'number' && entry.score >= 8;
}

function normalizeTitleForFranchise(title: string): string {
  let normalized = title.toLowerCase().trim();

  normalized = normalized
    .replace(/:\s+.+$/u, '')
    .replace(/\bseason\s+\d+\b/giu, '')
    .replace(/\bpart\s+\d+\b/giu, '')
    .replace(/\bcour\s+\d+\b/giu, '')
    .replace(/\b(ova|ona|special|movie|arc|the final chapters?)\b/giu, '')
    .replace(/\(\s*\d{4}\s*\)/gu, '')
    .replace(/\s+-\s+.+$/u, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  normalized = normalized.replace(/\b\d+\b$/u, '').trim();
  return normalized || title.toLowerCase().trim();
}

function getFranchiseAffinityMultiplier(seenCount: number): number {
  if (seenCount <= 0) {
    return 1;
  }
  if (seenCount === 1) {
    return 0.55;
  }
  if (seenCount === 2) {
    return 0.35;
  }
  return 0.2;
}

function getGenreSignalMultiplier(category: AffinityCategory, genre: string): number {
  if (category !== 'anime') {
    return 1;
  }

  const key = normalizeGenreKey(genre);
  if (ANIME_WEAK_METADATA_GENRES.has(key)) {
    return 0.28;
  }
  if (ANIME_SECONDARY_GENRES.has(key)) {
    return 0.7;
  }

  return 1;
}

function applyCategoryEntryCap(
  category: AffinityCategory,
  entry: AffinityEntry,
  computedWeight: number,
): number {
  if (category !== 'anime' || entry.status !== 'current' || computedWeight <= 0) {
    return computedWeight;
  }

  const hasExplicitScore = typeof entry.score === 'number';
  const hasProgressSignal = typeof entry.progress === 'number' && entry.progress > 0;

  if (!hasExplicitScore && !hasProgressSignal) {
    return Math.min(computedWeight, ANIME_CURRENT_MAX_WITHOUT_SCORE);
  }

  return Math.min(computedWeight, ANIME_CURRENT_MAX_WITH_SCORE);
}

function meetsDefaultEvidence(stats: {
  itemCount: number;
  favoriteCount: number;
  completedCount: number;
  highRatingCompletedCount: number;
}): boolean {
  if (stats.itemCount < MIN_ITEMS_DEFAULT) {
    return false;
  }

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
  if (stats.itemCount >= MIN_ITEMS_DEFAULT) {
    return meetsDefaultEvidence(stats);
  }

  return stats.favoriteCount >= 1 || stats.highRatingCompletedCount >= 1;
}

export function computeGenreAffinity(entries: AffinityEntry[]): GenreAffinityResult {
  const byCategory = new Map<AffinityCategory, AffinityEntry[]>();

  for (const entry of entries) {
    const cat = entry.category as AffinityCategory;
    if (!AFFINITY_CATEGORIES.includes(cat)) {
      continue;
    }
    if (!entry.genres || entry.genres.length === 0) {
      continue;
    }

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

    const isSmallLibrary = categoryEntries.length < SMALL_LIBRARY_THRESHOLD;
    const genreMap = new Map<string, GenreStats>();
    const franchiseSeenCount = new Map<string, number>();

    const animeDebugRows: Array<{
      title: string | null;
      status: string;
      score: number | null;
      favorite: boolean;
      progress: number | null;
      baseWeight: number;
      ratingMultiplier: number;
      favoriteMultiplier: number;
      franchiseKey: string | null;
      franchiseMultiplier: number;
      totalWeight: number;
      genres: Array<{ genre: string; signalMultiplier: number; weightedContribution: number }>;
    }> = [];

    for (const entry of categoryEntries) {
      const baseWeight = getBaseWeight(entry.status, entry.score);
      const ratingMultiplier = getRatingMultiplier(entry.score, entry.status);
      const favoriteMultiplier = getFavoriteMultiplier(entry.is_favorite);

      const franchiseKey =
        category === 'anime' && entry.title?.trim()
          ? normalizeTitleForFranchise(entry.title)
          : null;
      const seenCount = franchiseKey ? (franchiseSeenCount.get(franchiseKey) ?? 0) : 0;
      const franchiseMultiplier =
        category === 'anime' ? getFranchiseAffinityMultiplier(seenCount) : 1;

      const weightedBeforeCap =
        baseWeight * ratingMultiplier * favoriteMultiplier * franchiseMultiplier;
      const totalWeight = applyCategoryEntryCap(category, entry, weightedBeforeCap);

      if (franchiseKey) {
        franchiseSeenCount.set(franchiseKey, seenCount + 1);
      }

      const genreCount = entry.genres.length;
      const weightPerGenre = totalWeight / Math.sqrt(genreCount);
      const strong = isStrongSignal(entry);
      const highRatedCompleted = hasHighRatingCompleted(entry);

      const entryDebugGenres: Array<{
        genre: string;
        signalMultiplier: number;
        weightedContribution: number;
      }> = [];

      for (const rawGenre of entry.genres) {
        const label = rawGenre.trim();
        if (!label) {
          continue;
        }

        const signalMultiplier = getGenreSignalMultiplier(category, label);
        const weightedContribution = weightPerGenre * signalMultiplier;

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

        current.score += weightedContribution;
        current.itemCount += 1;

        if (strong) {
          current.strongSignalCount += 1;
        }
        if (entry.is_favorite) {
          current.favoriteCount += 1;
        }
        if (entry.status === 'completed') {
          current.completedCount += 1;
        }
        if (highRatedCompleted) {
          current.highRatingCompletedCount += 1;
        }

        genreMap.set(key, current);

        if (AFFINITY_DEBUG_ANIME && category === 'anime') {
          entryDebugGenres.push({
            genre: label,
            signalMultiplier,
            weightedContribution: Math.round(weightedContribution * 1000) / 1000,
          });
        }
      }

      if (AFFINITY_DEBUG_ANIME && category === 'anime') {
        animeDebugRows.push({
          title: entry.title,
          status: entry.status,
          score: entry.score,
          favorite: Boolean(entry.is_favorite),
          progress: entry.progress,
          baseWeight: Math.round(baseWeight * 1000) / 1000,
          ratingMultiplier: Math.round(ratingMultiplier * 1000) / 1000,
          favoriteMultiplier: Math.round(favoriteMultiplier * 1000) / 1000,
          franchiseKey,
          franchiseMultiplier: Math.round(franchiseMultiplier * 1000) / 1000,
          totalWeight: Math.round(totalWeight * 1000) / 1000,
          genres: entryDebugGenres,
        });
      }
    }

    const qualified: GenreScore[] = [];

    for (const stats of genreMap.values()) {
      const clampedScore = Math.max(0, stats.score);
      if (clampedScore === 0) {
        continue;
      }

      const meetsEvidence = isSmallLibrary
        ? meetsSmallLibraryEvidence(stats)
        : meetsDefaultEvidence(stats);

      if (!meetsEvidence) {
        continue;
      }

      qualified.push({
        genre: stats.label,
        score: Math.round(clampedScore * 100) / 100,
        itemCount: stats.itemCount,
        strongSignalCount: stats.strongSignalCount,
      });
    }

    qualified.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.itemCount !== a.itemCount) {
        return b.itemCount - a.itemCount;
      }
      return a.genre.localeCompare(b.genre);
    });

    if (qualified.length > 0) {
      result[category] = qualified.slice(0, TOP_GENRES_LIMIT);
    }

    if (AFFINITY_DEBUG_ANIME && category === 'anime') {
      const genreDebugSummary = Array.from(genreMap.values())
        .map(genre => ({
          genre: genre.label,
          score: Math.round(Math.max(0, genre.score) * 1000) / 1000,
          itemCount: genre.itemCount,
          strongSignalCount: genre.strongSignalCount,
        }))
        .sort((a, b) => b.score - a.score);

      console.warn(
        '[GenreAffinity Debug][anime]',
        JSON.stringify({
          entries: animeDebugRows,
          genres: genreDebugSummary,
          topGenres: result[category] ?? [],
        }),
      );
    }
  }

  return result;
}

type SupabaseClient = Awaited<ReturnType<typeof createRouteHandlerClient>>;

export async function fetchEntriesForAffinity(
  supabase: SupabaseClient,
  userId: string,
): Promise<AffinityEntry[]> {
  const { data, error } = await supabase
    .from('user_media_entries')
    .select('status,score,is_favorite,progress,media_items!inner(category,genres,title,original_title)')
    .eq('user_id', userId)
    .in('media_items.category', AFFINITY_CATEGORIES);

  if (error || !data) {
    return [];
  }

  const entries: AffinityEntry[] = [];

  for (const row of data as Array<Record<string, unknown>>) {
    const mediaRaw = row.media_items as unknown;
    const media = Array.isArray(mediaRaw)
      ? (mediaRaw[0] as Record<string, unknown> | undefined)
      : (mediaRaw as Record<string, unknown> | null | undefined);

    if (!media) {
      continue;
    }

    const category = media.category;
    if (typeof category !== 'string') {
      continue;
    }

    const genres = Array.isArray(media.genres)
      ? (media.genres as string[]).filter((g): g is string => typeof g === 'string')
      : [];

    const titleRaw =
      typeof media.title === 'string' && media.title.trim()
        ? media.title
        : typeof media.original_title === 'string' && media.original_title.trim()
          ? media.original_title
          : null;

    entries.push({
      title: titleRaw,
      status: typeof row.status === 'string' ? row.status : '',
      score: typeof row.score === 'number' ? row.score : null,
      is_favorite: typeof row.is_favorite === 'boolean' ? row.is_favorite : false,
      progress: typeof row.progress === 'number' ? row.progress : null,
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
  await supabase.from('user_genre_affinity').delete().eq('user_id', userId);

  const rows: Array<{
    user_id: string;
    category: string;
    genre: string;
    score: number;
    item_count: number;
    strong_signal_count: number;
  }> = [];

  for (const [category, genres] of Object.entries(affinity)) {
    if (!genres) {
      continue;
    }

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

export async function refreshGenreAffinity(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const entries = await fetchEntriesForAffinity(supabase, userId);
  const affinity = computeGenreAffinity(entries);
  await storeGenreAffinity(supabase, userId, affinity);
}

const FAVORITE_THRESHOLD_RATIO = 0.5;

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

  const grouped = new Map<string, Array<{ genre: string; score: number }>>();
  for (const row of data) {
    const list = grouped.get(row.category) ?? [];
    list.push({ genre: row.genre, score: row.score });
    grouped.set(row.category, list);
  }

  const result: Record<string, string[]> = {};
  for (const [category, genres] of grouped) {
    if (genres.length > 0) {
      result[category] = genres.slice(0, TOP_GENRES_LIMIT).map(g => g.genre);
    }
  }

  return result;
}

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

  const grouped = new Map<string, Array<{ genre: string; score: number }>>();
  for (const row of data) {
    const list = grouped.get(row.category) ?? [];
    list.push({ genre: row.genre, score: row.score });
    grouped.set(row.category, list);
  }

  const result: Record<string, string[]> = {};
  for (const [category, genres] of grouped) {
    const topGenres = genres.slice(0, TOP_GENRES_LIMIT);
    const topScore = topGenres[0]?.score ?? 0;
    if (topScore <= 0) {
      continue;
    }

    const threshold = topScore * FAVORITE_THRESHOLD_RATIO;
    const filtered = topGenres.filter(g => g.score >= threshold).map(g => g.genre);

    if (filtered.length > 0) {
      result[category] = filtered;
    }
  }

  return result;
}

export const fetchGenreAffinityMap = fetchFavoriteGenres;
