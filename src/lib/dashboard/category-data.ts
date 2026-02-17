import { subDays, formatDistanceToNowStrict, format } from 'date-fns';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { DEFAULT_COVER } from '@/lib/constants/messages';

export const DASHBOARD_TAB_CATEGORIES = [
  'games',
  'anime',
  'manga',
  'movies',
  'tv',
  'books',
] as const;
export type DashboardCategoryKey = (typeof DASHBOARD_TAB_CATEGORIES)[number];

export type DashboardTopFiveItem = {
  entryId: number;
  mediaId: number;
  title: string;
  cover: string;
  subtitle: string;
  progressPercent?: number;
  rating?: string;
  status: string;
  lastActivityAt?: string;
  isFavorite: boolean;
};

export type CategorySpotlightEntry = {
  title: string;
  cover: string;
  detail?: string;
  progressPercent?: number;
};

export type CategorySpotlightCard = {
  id: string;
  title: string;
  explanation: string;
  dataSubtitle: string;
  entry?: CategorySpotlightEntry;
  ctaLabel?: string;
};

export type CategoryChartPoint = {
  label: string;
  completed: number;
  dropped: number;
};

export type CategoryChartPayload = {
  data: CategoryChartPoint[];
  insight: string;
};

export type PlatformInsightRow = {
  platform: string;
  total: number;
  completed: number;
  dropped: number;
  completionRate: number;
};

export type PlatformInsightPayload = {
  rows: PlatformInsightRow[];
  best: PlatformInsightRow | null;
  worst: PlatformInsightRow | null;
  summary: string;
};

export type PersonalSuggestionCard = {
  id: string;
  icon: string;
  title: string;
  explanation: string;
  stat: string;
  supportingText?: string;
  ctaLabel?: string;
};

export type TasteProfileStatus = 'planned' | 'current' | 'completed' | 'dropped';

export type CategoryTasteProfileItem = {
  status: TasteProfileStatus;
  score: number | null;
  isFavorite?: boolean;
  genres: string[];
  tags: string[];
  bucketTags?: Partial<Record<InsightTagBucket, string[]>>;
};

export const INSIGHT_TAG_BUCKETS = ['subgenre', 'mechanic', 'mood', 'theme', 'structure'] as const;
export type InsightTagBucket = (typeof INSIGHT_TAG_BUCKETS)[number];

export type TasteProfileGenre = {
  name: string;
  count: number;
  weightSum: number;
  percent: number;
};

export type TasteProfileResult = {
  totalItems: number;
  totalWeight: number;
  ratedCount: number;
  unratedCount: number;
  ratedRatio: number;
  favoriteCount: number;
  completedItems: number;
  completedRatedCount: number;
  completedRatedRatio: number;
  topGenres: TasteProfileGenre[];
  topBuckets: Partial<Record<InsightTagBucket, TasteProfileGenre[]>>;
};

export type MediaSuggestion = {
  mediaId: number;
  category: DashboardCategoryKey;
  title: string;
  cover: string;
  slug: string;
  reason: string;
  confidence: number;
  genres?: string[];
  tags?: string[];
  bucketTags?: Partial<Record<InsightTagBucket, string[]>>;
};

export type CategoryDashboardSection = {
  topFive: DashboardTopFiveItem[];
  spotlights: CategorySpotlightCard[];
  chart: CategoryChartPayload;
  platformInsight: PlatformInsightPayload | null;
  tasteProfileItems: CategoryTasteProfileItem[];
  favorites: DashboardTopFiveItem[];
  mediaSuggestions: MediaSuggestion[];
};

const CATEGORY_LABELS: Record<DashboardCategoryKey, string> = {
  games: 'Games',
  books: 'Books',
  anime: 'Anime',
  manga: 'Manga',
  movies: 'Movies',
  tv: 'TV',
};

const TASTE_PROFILE_INCLUDED_STATUSES = new Set<TasteProfileStatus>(['completed', 'current']);
const DEFAULT_TASTE_PROFILE_TOP_GENRES = 5;
const DEFAULT_TASTE_PROFILE_TOP_BUCKET_TRAITS = 5;
const TASTE_PROFILE_UNKNOWN_GENRE_KEY = '__unknown__';
const TASTE_PROFILE_UNKNOWN_BUCKET_KEY = '__unknown_bucket__';
export const DEFAULT_TASTE_PROFILE_MIN_ITEMS_THRESHOLD = 8;
export const TASTE_PROFILE_SCORE_MIN = 0;
export const TASTE_PROFILE_SCORE_MAX = 10;
export const TASTE_PROFILE_BASE_WEIGHT = 0.25;
export const TASTE_PROFILE_RATING_BOOST = 1.0;
export const TASTE_PROFILE_UNRATED_WEIGHT = 0.35;
export const TASTE_PROFILE_FAVORITE_MULT = 1.35;
export const TASTE_PROFILE_MAX_WEIGHT =
  (TASTE_PROFILE_BASE_WEIGHT + TASTE_PROFILE_RATING_BOOST) * TASTE_PROFILE_FAVORITE_MULT;

const CATEGORY_ENTRY_SELECT = `
  id,
  status,
  score,
  progress,
  priority,
  pinned_rank,
  selected_platform,
  created_at,
  updated_at,
  notes,
  is_favorite,
  media_items!inner(
    id,
    category,
    title,
    title_english,
    title_romaji,
    title_native,
    original_title,
    description,
    format,
    season_year,
    episodes,
    number_of_episodes,
    chapters,
    volumes,
    page_count,
    runtime,
    duration,
    genres,
    tags,
    igdb_themes,
    igdb_game_modes,
    igdb_player_perspectives,
    platforms,
    release_date,
    cover_image_large,
  cover_image_medium,
  studios
)
`;

const CATEGORY_ENTRY_SELECT_LEGACY = `
  id,
  status,
  score,
  progress,
  priority,
  selected_platform,
  created_at,
  updated_at,
  notes,
  is_favorite,
  media_items!inner(
    id,
    category,
    title,
    title_english,
    title_romaji,
    title_native,
    original_title,
    description,
    format,
    season_year,
    episodes,
    number_of_episodes,
    chapters,
    volumes,
    page_count,
    runtime,
    duration,
    genres,
    tags,
    igdb_themes,
    igdb_game_modes,
    igdb_player_perspectives,
    platforms,
    release_date,
    cover_image_large,
  cover_image_medium,
  studios
)
`;

const DEFAULT_CHART_DAYS = 16;
const CATEGORY_ENTRY_PAGE_SIZE = 200;

type CategoryEntryRow = {
  id: number;
  status: 'planned' | 'current' | 'completed' | 'dropped';
  score: number | null;
  progress: number | null;
  priority: number | null;
  pinned_rank?: number | null;
  selected_platform?: string | null;
  created_at: string | null;
  updated_at: string | null;
  notes?: string | null;
  is_favorite?: boolean | null;
  media_items: {
    id: number;
    category: string | null;
    title?: string | null;
    title_english?: string | null;
    title_romaji?: string | null;
    title_native?: string | null;
    original_title?: string | null;
    format?: string | null;
    season_year?: number | null;
    episodes?: number | null;
    number_of_episodes?: number | null;
    chapters?: number | null;
    volumes?: number | null;
    page_count?: number | null;
    runtime?: number | null;
    duration?: number | null;
    genres?: string[] | null;
    tags?: string[] | null;
    igdb_themes?: string[] | null;
    igdb_game_modes?: string[] | null;
    igdb_player_perspectives?: string[] | null;
    platforms?: string[] | null;
    release_date?: string | null;
    cover_image_large?: string | null;
    cover_image_medium?: string | null;
    studios?: string[] | null;
  } | null;
};

type CategoryChartRow = {
  day: string | null;
  completed: number | null;
  dropped: number | null;
};

const createEmptySection = (category: DashboardCategoryKey): CategoryDashboardSection => ({
  topFive: [],
  spotlights: [],
  chart: {
    data: [],
    insight: `Add ${CATEGORY_LABELS[category]} entries to unlock completion trends.`,
  },
  platformInsight: null,
  tasteProfileItems: [],
  favorites: [],
  mediaSuggestions: [],
});

function buildEmptySpotlights(category: DashboardCategoryKey): CategorySpotlightCard[] {
  const titleBase = `${CATEGORY_LABELS[category]} insights`;
  return Array.from({ length: 4 }, (_, index) => ({
    id: `empty-${category}-${index}`,
    title: titleBase,
    explanation: `Log ${CATEGORY_LABELS[category].toLowerCase()} entries to surface this insight.`,
    dataSubtitle: 'Waiting for your data',
  }));
}

function normalizeTasteProfileLabels(item: CategoryTasteProfileItem): string[] {
  const source = item.genres.length > 0 ? item.genres : item.tags;
  const normalized = new Set<string>();

  for (const value of source) {
    const label = value?.trim().replace(/\s+/g, ' ').toLowerCase();
    if (!label) {
      continue;
    }
    normalized.add(label);
  }

  return Array.from(normalized);
}

function normalizeBucketLabels(item: CategoryTasteProfileItem, bucket: InsightTagBucket): string[] {
  const values = item.bucketTags?.[bucket] ?? [];
  const normalized = new Set<string>();
  for (const value of values) {
    const label = canonicalizeBucketLabel(
      bucket,
      value?.trim().replace(/\s+/g, ' ').toLowerCase() ?? '',
    );
    if (!label) {
      continue;
    }
    normalized.add(label);
  }
  return Array.from(normalized);
}

function canonicalizeBucketLabel(bucket: InsightTagBucket, label: string): string {
  if (!label) {
    return '';
  }
  if (bucket === 'subgenre') {
    const normalizedKey = label.replace(/[_\s]+/g, '-').replace(/-+/g, '-');
    if (normalizedKey === 'role-playing-game' || normalizedKey === 'rpg') {
      return 'rpg';
    }
    return label;
  }
  if (bucket !== 'structure') {
    return label;
  }

  const compact = label.replace(/[_\s]+/g, '-');
  if (/^(third|3rd)-person(?:-[a-z0-9]+)*$/.test(compact)) {
    return 'third-person';
  }

  return label;
}

function extractTasteTagLabelsFromMediaTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  const result: string[] = [];
  for (const entry of tags) {
    if (typeof entry === 'string') {
      const label = entry.trim();
      if (label) {
        result.push(label);
      }
      continue;
    }

    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const tag = entry as Record<string, unknown>;
    const bucket = tag.bucket;
    const type = tag.type;
    if (bucket === 'playstyle' || bucket === 'noise' || bucket === 'unknown') {
      continue;
    }
    if (type === 'noise' || type === 'playstyle') {
      continue;
    }

    const name =
      typeof tag.name === 'string' && tag.name.trim()
        ? tag.name.trim()
        : typeof tag.slug === 'string' && tag.slug.trim()
          ? tag.slug.trim()
          : '';
    if (name) {
      result.push(name);
    }
  }

  return Array.from(new Set(result));
}

function formatTasteProfileLabel(label: string): string {
  if (label === TASTE_PROFILE_UNKNOWN_GENRE_KEY || label === TASTE_PROFILE_UNKNOWN_BUCKET_KEY) {
    return 'Unknown';
  }
  if (label === 'rpg') {
    return 'RPG';
  }

  return label.replace(/\b\w/g, char => char.toUpperCase());
}

function isValidTasteProfileScore(score: number | null | undefined): score is number {
  return (
    typeof score === 'number' &&
    Number.isFinite(score) &&
    score >= TASTE_PROFILE_SCORE_MIN &&
    score <= TASTE_PROFILE_SCORE_MAX
  );
}

function getTasteProfileWeight(score: number | null | undefined): {
  weight: number;
  rated: boolean;
} {
  if (!isValidTasteProfileScore(score)) {
    return { weight: TASTE_PROFILE_UNRATED_WEIGHT, rated: false };
  }

  const scoreRange = TASTE_PROFILE_SCORE_MAX - TASTE_PROFILE_SCORE_MIN;
  if (scoreRange <= 0) {
    return { weight: TASTE_PROFILE_BASE_WEIGHT, rated: true };
  }

  const normalized = (score - TASTE_PROFILE_SCORE_MIN) / scoreRange;
  return {
    weight: TASTE_PROFILE_BASE_WEIGHT + normalized * TASTE_PROFILE_RATING_BOOST,
    rated: true,
  };
}

function applyFavoriteTasteProfileBoost(baseWeight: number, isFavorite?: boolean): number {
  const boostedWeight = isFavorite ? baseWeight * TASTE_PROFILE_FAVORITE_MULT : baseWeight;
  return Math.min(boostedWeight, TASTE_PROFILE_MAX_WEIGHT);
}

export function buildTasteProfile(
  items: CategoryTasteProfileItem[],
  category?: DashboardCategoryKey,
): TasteProfileResult {
  const trackedItems = items.filter(item => TASTE_PROFILE_INCLUDED_STATUSES.has(item.status));
  const totalItems = trackedItems.length;
  const completedItems = trackedItems.filter(item => item.status === 'completed');
  const completedItemsCount = completedItems.length;

  if (!totalItems) {
    return {
      totalItems: 0,
      totalWeight: 0,
      ratedCount: 0,
      unratedCount: 0,
      ratedRatio: 0,
      favoriteCount: 0,
      completedItems: 0,
      completedRatedCount: 0,
      completedRatedRatio: 0,
      topGenres: [],
      topBuckets: {},
    };
  }

  const genreCounts = new Map<string, number>();
  const genreWeightSums = new Map<string, number>();
  const bucketCounts: Record<InsightTagBucket, Map<string, number>> = {
    subgenre: new Map(),
    mechanic: new Map(),
    mood: new Map(),
    theme: new Map(),
    structure: new Map(),
  };
  const bucketWeightSums: Record<InsightTagBucket, Map<string, number>> = {
    subgenre: new Map(),
    mechanic: new Map(),
    mood: new Map(),
    theme: new Map(),
    structure: new Map(),
  };
  const bucketTotals: Record<InsightTagBucket, number> = {
    subgenre: 0,
    mechanic: 0,
    mood: 0,
    theme: 0,
    structure: 0,
  };

  let totalWeight = 0;
  let ratedCount = 0;
  let favoriteCount = 0;
  const useBucketMode = category === 'games';

  for (const item of trackedItems) {
    const { weight: baseWeight, rated } = getTasteProfileWeight(item.score);
    const weight = applyFavoriteTasteProfileBoost(baseWeight, item.isFavorite);
    totalWeight += weight;
    if (rated) {
      ratedCount += 1;
    }
    if (item.isFavorite) {
      favoriteCount += 1;
    }

    if (useBucketMode) {
      for (const bucket of INSIGHT_TAG_BUCKETS) {
        const labels = normalizeBucketLabels(item, bucket);
        const distributionLabels = labels.length > 0 ? labels : [TASTE_PROFILE_UNKNOWN_BUCKET_KEY];
        const distributedWeight =
          distributionLabels.length > 0 ? weight / distributionLabels.length : 0;
        bucketTotals[bucket] += weight;
        for (const label of distributionLabels) {
          bucketCounts[bucket].set(label, (bucketCounts[bucket].get(label) ?? 0) + 1);
          bucketWeightSums[bucket].set(
            label,
            (bucketWeightSums[bucket].get(label) ?? 0) + distributedWeight,
          );
        }
      }
      continue;
    }

    const labels = normalizeTasteProfileLabels(item);
    const distributionLabels = labels.length > 0 ? labels : [TASTE_PROFILE_UNKNOWN_GENRE_KEY];
    const distributedWeight =
      distributionLabels.length > 0 ? weight / distributionLabels.length : 0;
    for (const label of distributionLabels) {
      genreCounts.set(label, (genreCounts.get(label) ?? 0) + 1);
      genreWeightSums.set(label, (genreWeightSums.get(label) ?? 0) + distributedWeight);
    }
  }

  const unratedCount = totalItems - ratedCount;
  const ratedRatio = totalItems > 0 ? ratedCount / totalItems : 0;
  const completedRatedCount = completedItems.reduce(
    (count, item) => count + (isValidTasteProfileScore(item.score) ? 1 : 0),
    0,
  );
  const completedRatedRatio =
    completedItemsCount > 0 ? completedRatedCount / completedItemsCount : 0;

  const topGenres = useBucketMode
    ? []
    : Array.from(genreWeightSums.entries())
        .sort((a, b) => {
          if (b[1] !== a[1]) {
            return b[1] - a[1];
          }
          return a[0].localeCompare(b[0]);
        })
        .slice(0, DEFAULT_TASTE_PROFILE_TOP_GENRES)
        .map(([name, weightSum]) => ({
          name: formatTasteProfileLabel(name),
          count: genreCounts.get(name) ?? 0,
          weightSum,
          percent: totalWeight > 0 ? Number(((weightSum / totalWeight) * 100).toFixed(1)) : 0,
        }));

  const topBuckets = useBucketMode
    ? INSIGHT_TAG_BUCKETS.reduce(
        (acc, bucket) => {
          acc[bucket] = Array.from(bucketWeightSums[bucket].entries())
            .filter(([name]) => name !== TASTE_PROFILE_UNKNOWN_BUCKET_KEY)
            .sort((a, b) => {
              if (b[1] !== a[1]) {
                return b[1] - a[1];
              }
              return a[0].localeCompare(b[0]);
            })
            .slice(0, DEFAULT_TASTE_PROFILE_TOP_BUCKET_TRAITS)
            .map(([name, weightSum]) => ({
              name: formatTasteProfileLabel(name),
              count: bucketCounts[bucket].get(name) ?? 0,
              weightSum,
              percent:
                bucketTotals[bucket] > 0
                  ? Number(((weightSum / bucketTotals[bucket]) * 100).toFixed(1))
                  : 0,
            }));
          return acc;
        },
        {} as Partial<Record<InsightTagBucket, TasteProfileGenre[]>>,
      )
    : {};

  return {
    totalItems,
    totalWeight,
    ratedCount,
    unratedCount,
    ratedRatio,
    favoriteCount,
    completedItems: completedItemsCount,
    completedRatedCount,
    completedRatedRatio,
    topGenres,
    topBuckets,
  };
}

type DashboardSupabaseClient = Awaited<ReturnType<typeof createRouteHandlerClient>>;

export async function fetchCategoryDashboardData(
  userId: string,
  enabledCategories: string[],
): Promise<Record<DashboardCategoryKey, CategoryDashboardSection>> {
  const supabase = await createRouteHandlerClient();
  const requestedCategories = enabledCategories
    .map(cat => cat as DashboardCategoryKey)
    .filter(category => DASHBOARD_TAB_CATEGORIES.includes(category));

  const sections: Record<DashboardCategoryKey, CategoryDashboardSection> = {
    games: createEmptySection('games'),
    books: createEmptySection('books'),
    anime: createEmptySection('anime'),
    manga: createEmptySection('manga'),
    movies: createEmptySection('movies'),
    tv: createEmptySection('tv'),
  };

  if (requestedCategories.length === 0) {
    return sections;
  }

  const entryPromises = requestedCategories.map(category =>
    fetchCategoryEntries(supabase, userId, category),
  );
  const chartPromises = requestedCategories.map(category =>
    fetchCategoryChartPoints(supabase, userId, category),
  );

  const entryResults = await Promise.all(entryPromises);
  const chartResults = await Promise.all(chartPromises);

  // Fetch media suggestions in parallel
  const mediaSuggestionsPromises = requestedCategories.map((category, index) => {
    const entries = entryResults[index] ?? [];
    return buildMediaSuggestions(supabase, userId, category, entries);
  });

  const mediaSuggestionsResults = await Promise.all(mediaSuggestionsPromises);
  const gameTagMapByCategory = new Map<
    DashboardCategoryKey,
    Map<number, Partial<Record<InsightTagBucket, string[]>>>
  >();

  await Promise.all(
    requestedCategories.map(async (category, index) => {
      if (category !== 'games') {
        return;
      }
      const entries = entryResults[index] ?? [];
      const mediaIds = entries
        .map(entry => entry.media_items?.id)
        .filter((mediaId): mediaId is number => typeof mediaId === 'number');
      const tagMap = await fetchGameInsightTagMap(supabase, mediaIds);
      gameTagMapByCategory.set(category, tagMap);
    }),
  );

  requestedCategories.forEach((category, index) => {
    const entries = entryResults[index] ?? [];
    const chartRows = chartResults[index] ?? [];
    const topFive = buildTopFive(entries, category);
    const excludedIds = new Set(topFive.map(item => item.entryId));

    sections[category] = {
      topFive,
      spotlights: [],
      chart: buildCategoryChart(category, chartRows),
      platformInsight: category === 'games' ? buildGamePlatformInsight(entries) : null,
      tasteProfileItems: buildCategoryTasteProfileItems(
        entries,
        category,
        gameTagMapByCategory.get(category),
      ),
      favorites: buildFavoriteEntryCards(entries, excludedIds, category),
      mediaSuggestions: mediaSuggestionsResults[index] ?? [],
    };
  });

  return sections;
}

async function fetchGameInsightTagMap(
  supabase: DashboardSupabaseClient,
  mediaIds: number[],
): Promise<Map<number, Partial<Record<InsightTagBucket, string[]>>>> {
  if (mediaIds.length === 0) {
    return new Map();
  }
  const uniqueMediaIds = Array.from(new Set(mediaIds));
  const { data, error } = await supabase
    .from('media_items')
    .select('id,genres,igdb_themes,igdb_game_modes,igdb_player_perspectives')
    .in('id', uniqueMediaIds);

  if (error || !Array.isArray(data)) {
    return new Map();
  }

  const normalizeArray = (input: unknown): string[] => {
    if (!Array.isArray(input)) {
      return [];
    }
    return Array.from(
      new Set(input.map(item => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)),
    );
  };

  const result = new Map<number, Partial<Record<InsightTagBucket, string[]>>>();
  for (const row of data as unknown as Array<Record<string, unknown>>) {
    const id = typeof row.id === 'number' ? row.id : null;
    if (!id) {
      continue;
    }

    const genres = normalizeArray(row.genres);
    const themes = normalizeArray(row.igdb_themes);
    const modes = normalizeArray(row.igdb_game_modes);
    const perspectives = normalizeArray(row.igdb_player_perspectives);

    result.set(id, {
      subgenre: genres,
      mechanic: modes,
      theme: themes,
      structure: perspectives,
    });
  }

  return result;
}

function buildCategoryTasteProfileItems(
  entries: CategoryEntryRow[],
  category: DashboardCategoryKey,
  gameTagMap?: Map<number, Partial<Record<InsightTagBucket, string[]>>>,
): CategoryTasteProfileItem[] {
  return entries.map(entry => ({
    status: entry.status,
    score: typeof entry.score === 'number' && Number.isFinite(entry.score) ? entry.score : null,
    isFavorite: Boolean(entry.is_favorite),
    genres: Array.isArray(entry.media_items?.genres)
      ? entry.media_items?.genres.filter((genre): genre is string => Boolean(genre?.trim()))
      : [],
    tags: category === 'games' ? [] : extractTasteTagLabelsFromMediaTags(entry.media_items?.tags),
    bucketTags:
      category === 'games' && entry.media_items?.id
        ? (gameTagMap?.get(entry.media_items.id) ?? {})
        : undefined,
  }));
}

async function fetchCategoryEntries(
  supabase: DashboardSupabaseClient,
  userId: string,
  category: DashboardCategoryKey,
): Promise<CategoryEntryRow[]> {
  const runQuery = async (selectStatement: string) => {
    const rows: CategoryEntryRow[] = [];
    let page = 0;

    while (true) {
      const from = page * CATEGORY_ENTRY_PAGE_SIZE;
      const to = from + CATEGORY_ENTRY_PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('user_media_entries')
        .select(selectStatement)
        .eq('user_id', userId)
        .eq('media_items.category', category)
        .order('priority', { ascending: false })
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      const pageRows = Array.isArray(data) ? (data as unknown as CategoryEntryRow[]) : [];
      rows.push(...pageRows.filter(row => row.media_items?.category === category));

      if (pageRows.length < CATEGORY_ENTRY_PAGE_SIZE) {
        break;
      }

      page += 1;
    }

    return rows;
  };

  try {
    return await runQuery(CATEGORY_ENTRY_SELECT);
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '42703' &&
      /pinned_rank/i.test(JSON.stringify(error))
    ) {
      return runQuery(CATEGORY_ENTRY_SELECT_LEGACY);
    }
    throw error;
  }
}

async function fetchCategoryChartPoints(
  supabase: DashboardSupabaseClient,
  userId: string,
  category: DashboardCategoryKey,
): Promise<CategoryChartRow[]> {
  const since = subDays(new Date(), DEFAULT_CHART_DAYS).toISOString();
  const { data, error } = await supabase.rpc('category_dashboard_history', {
    p_user_id: userId,
    p_category: category,
    p_since: since,
  });

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? (data as CategoryChartRow[]) : [];
}

function resolveTitle(media: NonNullable<CategoryEntryRow['media_items']>): string | null {
  return (
    media.title ??
    media.title_english ??
    media.title_romaji ??
    media.title_native ??
    media.original_title ??
    null
  );
}

function getCover(media: NonNullable<CategoryEntryRow['media_items']>): string {
  return media.cover_image_large ?? media.cover_image_medium ?? DEFAULT_COVER;
}

function deriveSubtitle(entry: CategoryEntryRow, category: DashboardCategoryKey): string {
  const media = entry.media_items;
  if (!media) {
    return CATEGORY_LABELS[category];
  }
  const genre = (media.genres ?? []).find(Boolean);
  const tag = (media.tags ?? []).find(Boolean);
  const format = media.format;
  const entryPlatform = entry.selected_platform?.trim();
  const mediaPlatform = (media.platforms ?? []).find(Boolean);
  const platform = entryPlatform ?? mediaPlatform;

  switch (category) {
    case 'games':
      return platform ?? genre ?? format ?? `${CATEGORY_LABELS[category]} favorite`;
    case 'books':
      return tag ?? genre ?? `${CATEGORY_LABELS[category]} favorite`;
    case 'anime':
      return genre ?? format ?? `${CATEGORY_LABELS[category]} favorite`;
    case 'manga':
      return genre ?? tag ?? `${CATEGORY_LABELS[category]} favorite`;
    case 'movies':
      return format ?? genre ?? `${CATEGORY_LABELS[category]} favorite`;
    default:
      return CATEGORY_LABELS[category];
  }
}

function computeProgressPercent(
  entry: CategoryEntryRow,
  media: NonNullable<CategoryEntryRow['media_items']>,
  category: DashboardCategoryKey,
): number | undefined {
  if (entry.progress === null || entry.progress === undefined) {
    return undefined;
  }

  const total = getCategoryTotal(media, category);
  if (!total || total === 0) {
    return undefined;
  }

  return Math.min(100, Math.round((entry.progress / total) * 100));
}

function getCategoryTotal(
  media: NonNullable<CategoryEntryRow['media_items']>,
  category: DashboardCategoryKey,
): number | null {
  switch (category) {
    case 'games':
    case 'movies':
      return media.runtime ?? media.duration ?? null;
    case 'anime':
      return media.number_of_episodes ?? media.episodes ?? null;
    case 'tv':
      return media.number_of_episodes ?? media.episodes ?? null;
    case 'manga':
      return media.volumes ?? media.chapters ?? null;
    case 'books':
      return media.page_count ?? null;
    default:
      return null;
  }
}

function formatRelativeDistance(timestamp?: string | null): string {
  if (!timestamp) {
    return 'Recently';
  }
  return formatDistanceToNowStrict(new Date(timestamp), { addSuffix: true });
}

function enrichEntry(
  entry: CategoryEntryRow,
  category: DashboardCategoryKey,
): DashboardTopFiveItem {
  const media = entry.media_items!;
  const title = resolveTitle(media) ?? CATEGORY_LABELS[category];
  const cover = getCover(media);
  const subtitle = deriveSubtitle(entry, category);
  const progressPercent = computeProgressPercent(entry, media, category);
  const rating =
    entry.score !== null && entry.score !== undefined ? entry.score.toFixed(1) : undefined;
  const lastActivity = entry.updated_at ?? entry.created_at ?? undefined;

  return {
    entryId: entry.id,
    mediaId: media.id,
    title,
    cover,
    subtitle,
    progressPercent,
    rating,
    status: entry.status,
    lastActivityAt: lastActivity,
    isFavorite: Boolean(entry.is_favorite),
  };
}

const PINNED_PRIORITY_THRESHOLD = 50;

function buildTopFive(
  entries: CategoryEntryRow[],
  category: DashboardCategoryKey,
): DashboardTopFiveItem[] {
  const pinnedEntries = entries
    .filter(entry => entry.pinned_rank !== null && entry.pinned_rank !== undefined)
    .sort((a, b) => (a.pinned_rank ?? Infinity) - (b.pinned_rank ?? Infinity));

  let topCandidates = pinnedEntries.slice(0, 5);

  if (!topCandidates.length) {
    const favoriteEntries = entries.filter(entry => entry.is_favorite);
    if (!favoriteEntries.length) {
      return [];
    }
    topCandidates = sortEntries(favoriteEntries, category).slice(0, 5);
  }

  return topCandidates.map(entry => enrichEntry(entry, category));
}

function sortEntries(entries: CategoryEntryRow[], category: DashboardCategoryKey) {
  return [...entries].sort((a, b) => {
    const pinnedA = (a.priority ?? 0) >= PINNED_PRIORITY_THRESHOLD ? 1 : 0;
    const pinnedB = (b.priority ?? 0) >= PINNED_PRIORITY_THRESHOLD ? 1 : 0;
    if (pinnedA !== pinnedB) {
      return pinnedB - pinnedA;
    }
    const ratingA = a.score ?? 0;
    const ratingB = b.score ?? 0;
    if (ratingB !== ratingA) {
      return ratingB - ratingA;
    }
    const progressA = computeProgressPercent(a, a.media_items!, category) ?? 0;
    const progressB = computeProgressPercent(b, b.media_items!, category) ?? 0;
    if (progressB !== progressA) {
      return progressB - progressA;
    }
    const updatedA = new Date(a.updated_at ?? a.created_at ?? 0).getTime();
    const updatedB = new Date(b.updated_at ?? b.created_at ?? 0).getTime();
    return updatedB - updatedA;
  });
}

function buildFavoriteEntryCards(
  entries: CategoryEntryRow[],
  excludedIds: Set<number>,
  category: DashboardCategoryKey,
): DashboardTopFiveItem[] {
  return sortEntries(
    entries.filter(entry => entry.is_favorite && !excludedIds.has(entry.id)),
    category,
  ).map(entry => enrichEntry(entry, category));
}

function buildSpotlights(
  category: DashboardCategoryKey,
  entries: CategoryEntryRow[],
): CategorySpotlightCard[] {
  switch (category) {
    case 'games':
      return buildGameSpotlights(entries);
    case 'books':
      return buildBookSpotlights(entries);
    case 'anime':
      return buildAnimeSpotlights(entries);
    case 'manga':
      return buildMangaSpotlights(entries);
    case 'movies':
      return buildMovieSpotlights(entries);
    case 'tv':
      return buildTvSpotlights(entries);
    default:
      return buildEmptySpotlights(category);
  }
}
void buildSpotlights;

function buildSpotlightEntry(
  entry: CategoryEntryRow,
  category: DashboardCategoryKey,
  percent?: number,
): CategorySpotlightEntry {
  const media = entry.media_items!;
  return {
    title: resolveTitle(media) ?? CATEGORY_LABELS[category],
    cover: getCover(media),
    detail: percent ? `${percent}% complete` : undefined,
    progressPercent: percent ?? computeProgressPercent(entry, media, category),
  };
}

function ensureFourSpotlights(
  cards: CategorySpotlightCard[],
  category: DashboardCategoryKey,
): CategorySpotlightCard[] {
  const picked: CategorySpotlightCard[] = [];
  const seen = new Set<string>();
  for (const card of cards) {
    if (seen.has(card.id)) {
      continue;
    }
    seen.add(card.id);
    picked.push(card);
    if (picked.length === 4) {
      break;
    }
  }

  while (picked.length < 4) {
    picked.push({
      id: `fill-${category}-${picked.length}`,
      title: 'More activity needed',
      explanation: `Add ${CATEGORY_LABELS[category].toLowerCase()} entries to unlock this insight.`,
      dataSubtitle: 'Waiting for data',
    });
  }

  return picked;
}

const GAMES_PLATFORM_INSUFFICIENT_DATA = 'Not enough data to compare platforms yet.';
const MIN_PLATFORM_ENTRIES_FOR_COMPARISON = 3;

function normalizePlatformLabel(platform: string | null | undefined): string {
  const value = platform?.trim();
  return value ? value : 'Unspecified';
}

function buildGamePlatformInsight(entries: CategoryEntryRow[]): PlatformInsightPayload {
  const platformMap = new Map<string, { total: number; completed: number; dropped: number }>();

  for (const entry of entries) {
    const platform = normalizePlatformLabel(entry.selected_platform);
    const current = platformMap.get(platform) ?? { total: 0, completed: 0, dropped: 0 };

    current.total += 1;
    if (entry.status === 'completed') {
      current.completed += 1;
    }
    if (entry.status === 'dropped') {
      current.dropped += 1;
    }

    platformMap.set(platform, current);
  }

  const rows: PlatformInsightRow[] = Array.from(platformMap.entries())
    .map(([platform, counts]) => ({
      platform,
      total: counts.total,
      completed: counts.completed,
      dropped: counts.dropped,
      completionRate: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
    }))
    .sort((a, b) => {
      if (b.completionRate !== a.completionRate) {
        return b.completionRate - a.completionRate;
      }
      if (b.total !== a.total) {
        return b.total - a.total;
      }
      return a.platform.localeCompare(b.platform);
    });

  const comparableRows = rows.filter(row => row.total >= MIN_PLATFORM_ENTRIES_FOR_COMPARISON);
  if (comparableRows.length < 2) {
    return {
      rows,
      best: null,
      worst: null,
      summary: GAMES_PLATFORM_INSUFFICIENT_DATA,
    };
  }

  const best = [...comparableRows].sort((a, b) => {
    if (b.completionRate !== a.completionRate) {
      return b.completionRate - a.completionRate;
    }
    if (b.total !== a.total) {
      return b.total - a.total;
    }
    return a.platform.localeCompare(b.platform);
  })[0];

  const worst = [...comparableRows].sort((a, b) => {
    if (a.completionRate !== b.completionRate) {
      return a.completionRate - b.completionRate;
    }
    if (b.total !== a.total) {
      return b.total - a.total;
    }
    return a.platform.localeCompare(b.platform);
  })[0];

  const summary =
    best.completionRate === worst.completionRate
      ? `You complete titles at a similar rate on ${best.platform} and ${worst.platform} (${best.completionRate}%).`
      : `You complete more titles on ${best.platform} (${best.completionRate}%) than ${worst.platform} (${worst.completionRate}%).`;

  return { rows, best, worst, summary };
}

function buildGameSpotlights(entries: CategoryEntryRow[]): CategorySpotlightCard[] {
  const current = entries.filter(entry => entry.status === 'current');
  const completed = entries
    .filter(entry => entry.status === 'completed')
    .sort(
      (a, b) =>
        Number(new Date(b.updated_at ?? b.created_at ?? 0)) -
        Number(new Date(a.updated_at ?? a.created_at ?? 0)),
    );

  const closest = current
    .map(entry => ({
      entry,
      percent: computeProgressPercent(entry, entry.media_items!, 'games') ?? 0,
    }))
    .filter(item => item.percent > 0)
    .sort((a, b) => b.percent - a.percent)[0];

  const stale = current.find(entry => {
    if (!entry.updated_at) {
      return false;
    }
    return new Date(entry.updated_at) < subDays(new Date(), 14);
  });

  const recent = completed[0];
  const cards: CategorySpotlightCard[] = [];

  if (closest) {
    cards.push({
      id: 'games-closest',
      title: 'Closest to finish',
      explanation: `You are ${closest.percent}% through ${
        resolveTitle(closest.entry.media_items!) ?? 'this game'
      }.`,
      dataSubtitle: formatRelativeDistance(closest.entry.updated_at),
      entry: buildSpotlightEntry(closest.entry, 'games', closest.percent),
      ctaLabel: 'Continue playing',
    });
  } else {
    cards.push({
      id: 'games-closest-empty',
      title: 'Closest to finish',
      explanation: 'No in-progress games above 70% yet. Keep going to surface one.',
      dataSubtitle: 'Track more progress to unlock this card.',
    });
  }

  if (stale) {
    cards.push({
      id: 'games-stale',
      title: 'Stale in progress',
      explanation: 'This game has not been updated in over two weeks.',
      dataSubtitle: formatRelativeDistance(stale.updated_at),
      entry: buildSpotlightEntry(stale, 'games'),
      ctaLabel: 'Resume now',
    });
  } else {
    cards.push({
      id: 'games-stale-empty',
      title: 'Stale in progress',
      explanation: 'All current games have had recent activity. Nice momentum.',
      dataSubtitle: 'No stale entries.',
    });
  }

  if (recent) {
    cards.push({
      id: 'games-completed',
      title: 'Recently completed',
      explanation: 'You just cleared this game—great work!',
      dataSubtitle: formatRelativeDistance(recent.updated_at),
      entry: buildSpotlightEntry(recent, 'games'),
    });
  } else {
    cards.push({
      id: 'games-completed-empty',
      title: 'Recently completed',
      explanation: 'Finish a game to surface your latest completion here.',
      dataSubtitle: 'No completions yet.',
    });
  }

  return ensureFourSpotlights(cards, 'games');
}

function buildBookSpotlights(entries: CategoryEntryRow[]): CategorySpotlightCard[] {
  const current = entries.filter(entry => entry.status === 'current');
  const completed = entries
    .filter(entry => entry.status === 'completed')
    .sort(
      (a, b) =>
        Number(new Date(b.updated_at ?? b.created_at ?? 0)) -
        Number(new Date(a.updated_at ?? a.created_at ?? 0)),
    );

  const closest = current
    .map(entry => ({
      entry,
      percent: computeProgressPercent(entry, entry.media_items!, 'books') ?? 0,
    }))
    .filter(item => item.percent > 0)
    .sort((a, b) => b.percent - a.percent)[0];

  const longestRead = current
    .filter(entry => entry.created_at)
    .sort((a, b) => Number(new Date(a.created_at!)) - Number(new Date(b.created_at!)))[0];

  const recent = completed[0];

  const seriesReminder = entries.find(entry => {
    if (!entry.media_items) {
      return false;
    }
    const totalVolumes =
      entry.media_items.volumes ??
      entry.media_items.chapters ??
      (entry.media_items.page_count ? Math.ceil(entry.media_items.page_count / 220) : undefined);
    if (!totalVolumes || !entry.progress) {
      return false;
    }
    return entry.progress < totalVolumes;
  });

  const cards: CategorySpotlightCard[] = [];

  if (closest) {
    cards.push({
      id: 'books-closest',
      title: 'Closest to finish',
      explanation: `You are ${closest.percent}% through ${
        resolveTitle(closest.entry.media_items!) ?? 'this book'
      }.`,
      dataSubtitle: formatRelativeDistance(closest.entry.updated_at),
      entry: buildSpotlightEntry(closest.entry, 'books', closest.percent),
    });
  } else {
    cards.push({
      id: 'books-closest-empty',
      title: 'Closest to finish',
      explanation: 'No book is above 80% yet. Add some progress to highlight one.',
      dataSubtitle: 'Track longer reads to surface this card.',
    });
  }

  if (longestRead) {
    cards.push({
      id: 'books-longest',
      title: 'Longest running read',
      explanation: 'This book has been in your current list the longest.',
      dataSubtitle: `Started ${formatRelativeDistance(longestRead.created_at)}`,
      entry: buildSpotlightEntry(longestRead, 'books'),
      ctaLabel: 'Pick up where you left off',
    });
  } else {
    cards.push({
      id: 'books-longest-empty',
      title: 'Longest running read',
      explanation: 'Add a book and keep it current to surface the oldest entry.',
      dataSubtitle: 'No current books yet.',
    });
  }

  if (recent) {
    cards.push({
      id: 'books-completed',
      title: 'Recently completed',
      explanation: 'You finished this book—nice work!',
      dataSubtitle: formatRelativeDistance(recent.updated_at),
      entry: buildSpotlightEntry(recent, 'books'),
    });
  } else {
    cards.push({
      id: 'books-completed-empty',
      title: 'Recently completed',
      explanation: 'Complete a read to highlight your latest finish here.',
      dataSubtitle: 'No completions yet.',
    });
  }

  if (seriesReminder) {
    cards.push({
      id: 'books-series',
      title: 'Series continuation reminder',
      explanation: 'You are partway through a multi-book series with more volumes ahead.',
      dataSubtitle: formatRelativeDistance(seriesReminder.updated_at),
      entry: buildSpotlightEntry(seriesReminder, 'books'),
      ctaLabel: 'Check next volume',
    });
  } else {
    cards.push({
      id: 'books-series-empty',
      title: 'Series continuation reminder',
      explanation:
        'Series data not yet available. Complete or add a series entry to fill this slot.',
      dataSubtitle: 'No eligible series entries.',
    });
  }

  return ensureFourSpotlights(cards, 'books');
}

function buildAnimeSpotlights(entries: CategoryEntryRow[]): CategorySpotlightCard[] {
  const current = entries.filter(entry => entry.status === 'current');
  const completed = entries
    .filter(entry => entry.status === 'completed')
    .sort(
      (a, b) =>
        Number(new Date(b.updated_at ?? b.created_at ?? 0)) -
        Number(new Date(a.updated_at ?? a.created_at ?? 0)),
    );

  const nextEpisodeReady = current
    .map(entry => ({
      entry,
      percent: computeProgressPercent(entry, entry.media_items!, 'anime') ?? 0,
    }))
    .filter(item => entryHasEpisodes(item.entry, 'anime') && item.percent < 100)
    .sort((a, b) => b.percent - a.percent)[0];

  const almostFinished = current
    .map(entry => ({
      entry,
      percent: computeProgressPercent(entry, entry.media_items!, 'anime') ?? 0,
    }))
    .filter(item => item.percent >= 85)
    .sort((a, b) => b.percent - a.percent)[0];

  const recent = completed[0];

  const dropInsight = buildDropPattern(entries);

  const cards: CategorySpotlightCard[] = [];

  if (nextEpisodeReady) {
    cards.push({
      id: 'anime-next',
      title: 'Next episode ready',
      explanation: 'You are in-progress with a show that still has unwatched episodes.',
      dataSubtitle: formatRelativeDistance(nextEpisodeReady.entry.updated_at),
      entry: buildSpotlightEntry(nextEpisodeReady.entry, 'anime', nextEpisodeReady.percent),
      ctaLabel: 'Watch episode',
    });
  } else {
    cards.push({
      id: 'anime-next-empty',
      title: 'Next episode ready',
      explanation:
        'No current anime with enough progress yet. Keep watching to unlock this insight.',
      dataSubtitle: 'No entries need a next episode reminder.',
    });
  }

  if (almostFinished) {
    cards.push({
      id: 'anime-almost',
      title: 'Almost finished',
      explanation: 'This show is more than 85% complete.',
      dataSubtitle: formatRelativeDistance(almostFinished.entry.updated_at),
      entry: buildSpotlightEntry(almostFinished.entry, 'anime', almostFinished.percent),
    });
  } else {
    cards.push({
      id: 'anime-almost-empty',
      title: 'Almost finished',
      explanation: 'No shows currently above 85%. Push one farther for this card.',
      dataSubtitle: 'Track progress to surface a near-completion.',
    });
  }

  if (recent) {
    cards.push({
      id: 'anime-completed',
      title: 'Recently completed',
      explanation: 'You finished this anime—well done!',
      dataSubtitle: formatRelativeDistance(recent.updated_at),
      entry: buildSpotlightEntry(recent, 'anime'),
    });
  } else {
    cards.push({
      id: 'anime-completed-empty',
      title: 'Recently completed',
      explanation: 'Complete a show to spotlight your latest finish.',
      dataSubtitle: 'No completions this period.',
    });
  }

  cards.push({
    id: 'anime-drop',
    title: 'Drop pattern insight',
    explanation: dropInsight.explanation,
    dataSubtitle: dropInsight.subtitle,
  });

  return ensureFourSpotlights(cards, 'anime');
}

function buildMangaSpotlights(entries: CategoryEntryRow[]): CategorySpotlightCard[] {
  const current = entries.filter(entry => entry.status === 'current');
  const completed = entries.filter(entry => entry.status === 'completed');

  const catchUp = current.find(entry => {
    const media = entry.media_items;
    if (!media) {
      return false;
    }
    const totalVolumes = media.volumes ?? media.chapters ?? 0;
    if (!entry.progress) {
      return false;
    }
    return totalVolumes > entry.progress;
  });

  const almostFinished = current
    .map(entry => ({
      entry,
      percent: computeProgressPercent(entry, entry.media_items!, 'manga') ?? 0,
    }))
    .filter(item => item.percent >= 85)
    .sort((a, b) => b.percent - a.percent)[0];

  const hiatus = current.find(entry => {
    if (!entry.updated_at) {
      return false;
    }
    return new Date(entry.updated_at) < subDays(new Date(), 21);
  });

  const completionRatio =
    completed.length === 0
      ? 0
      : Math.round(
          (completed.length /
            (completed.length +
              current.length +
              entries.filter(e => e.status === 'dropped').length)) *
            100,
        );

  const cards: CategorySpotlightCard[] = [];

  if (catchUp) {
    cards.push({
      id: 'manga-catchup',
      title: 'Volume catch-up',
      explanation: 'You are behind the latest volume for this series.',
      dataSubtitle: formatRelativeDistance(catchUp.updated_at),
      entry: buildSpotlightEntry(catchUp, 'manga'),
      ctaLabel: 'Catch up',
    });
  } else {
    cards.push({
      id: 'manga-catchup-empty',
      title: 'Volume catch-up',
      explanation: 'No entries are unusually behind. Keep reading to unlock a catch-up prompt.',
      dataSubtitle: 'All current entries are near release.',
    });
  }

  if (almostFinished) {
    cards.push({
      id: 'manga-almost',
      title: 'Almost finished',
      explanation: 'This manga is nearly complete.',
      dataSubtitle: formatRelativeDistance(almostFinished.entry.updated_at),
      entry: buildSpotlightEntry(almostFinished.entry, 'manga', almostFinished.percent),
    });
  } else {
    cards.push({
      id: 'manga-almost-empty',
      title: 'Almost finished',
      explanation: 'Push a current manga past 85% to highlight it here.',
      dataSubtitle: 'No near-completions.',
    });
  }

  if (hiatus) {
    cards.push({
      id: 'manga-hiatus',
      title: 'Long hiatus reading',
      explanation: 'This manga hasn’t been updated in over three weeks.',
      dataSubtitle: formatRelativeDistance(hiatus.updated_at),
      entry: buildSpotlightEntry(hiatus, 'manga'),
    });
  } else {
    cards.push({
      id: 'manga-hiatus-empty',
      title: 'Long hiatus reading',
      explanation: 'No long-lived entries yet. Keep momentum going to unlock this card.',
      dataSubtitle: 'No stalled entries found.',
    });
  }

  cards.push({
    id: 'manga-completion',
    title: 'Completion rate by length',
    explanation: `You complete ${completionRatio}% of manga entries when you open them.`,
    dataSubtitle: `${completed.length} completions · ${current.length} in-progress`,
  });

  return ensureFourSpotlights(cards, 'manga');
}

function buildMovieSpotlights(entries: CategoryEntryRow[]): CategorySpotlightCard[] {
  const planned = entries.filter(entry => entry.status === 'planned');
  const completed = entries
    .filter(entry => entry.status === 'completed')
    .sort(
      (a, b) =>
        Number(new Date(b.updated_at ?? b.created_at ?? 0)) -
        Number(new Date(a.updated_at ?? a.created_at ?? 0)),
    );

  const watchNext = planned
    .filter(entry => {
      if (!entry.created_at) {
        return false;
      }
      return new Date(entry.created_at) >= subDays(new Date(), 14);
    })
    .sort((a, b) => Number(new Date(b.created_at!)) - Number(new Date(a.created_at!)))[0];

  const studioCounts: Record<string, number> = {};
  completed.forEach(entry => {
    const studios = entry.media_items?.studios ?? [];
    studios.forEach(studio => {
      if (!studio) {
        return;
      }
      studioCounts[studio] = (studioCounts[studio] ?? 0) + 1;
    });
  });
  const topStudio = Object.entries(studioCounts).sort(([, a], [, b]) => b - a)[0];

  const genreRatio = buildCompletionByGenre(entries);

  const rewatchCount = entries.filter(entry =>
    entry.notes?.toLowerCase().includes('rewatch'),
  ).length;

  const cards: CategorySpotlightCard[] = [];

  if (watchNext) {
    cards.push({
      id: 'movies-watch-next',
      title: 'Watch next',
      explanation: 'You recently added this to your list but have not started it yet.',
      dataSubtitle: formatRelativeDistance(watchNext.created_at),
      entry: buildSpotlightEntry(watchNext, 'movies'),
      ctaLabel: 'Start watching',
    });
  } else {
    cards.push({
      id: 'movies-watch-next-empty',
      title: 'Watch next',
      explanation: 'Add a recent plan to highlight your next pick.',
      dataSubtitle: 'No fresh plans.',
    });
  }

  if (topStudio && topStudio[1] >= 3) {
    cards.push({
      id: 'movies-director',
      title: 'Director pattern',
      explanation: `You complete ${topStudio[1]} titles from ${topStudio[0]}.`,
      dataSubtitle: `${topStudio[0]} is your top studio.`,
    });
  } else {
    cards.push({
      id: 'movies-director-empty',
      title: 'Director pattern',
      explanation: 'We need more completions to surface a favorite director/studio.',
      dataSubtitle: 'Fewer than 3 titles from any studio yet.',
    });
  }

  cards.push({
    id: 'movies-genre',
    title: 'Completion ratio by genre',
    explanation: genreRatio.explanation,
    dataSubtitle: genreRatio.subtitle,
  });

  if (rewatchCount > 0) {
    cards.push({
      id: 'movies-rewatch',
      title: 'Rewatch trend',
      explanation: `You logged "${rewatchCount}" rewatch notes, signaling repeats.`,
      dataSubtitle: `Notes mentioning rewatch`,
    });
  } else {
    cards.push({
      id: 'movies-rewatch-empty',
      title: 'Rewatch trend',
      explanation:
        'No explicit rewatch notes yet. Note when you revisit a movie to track the trend.',
      dataSubtitle: 'No rewatch notes found.',
    });
  }

  return ensureFourSpotlights(cards, 'movies');
}

function buildTvSpotlights(entries: CategoryEntryRow[]): CategorySpotlightCard[] {
  const current = entries.filter(entry => entry.status === 'current');
  const completed = entries
    .filter(entry => entry.status === 'completed')
    .sort(
      (a, b) =>
        Number(new Date(b.updated_at ?? b.created_at ?? 0)) -
        Number(new Date(a.updated_at ?? a.created_at ?? 0)),
    );

  const nextEpisodeReady = current
    .map(entry => ({
      entry,
      percent: computeProgressPercent(entry, entry.media_items!, 'tv') ?? 0,
    }))
    .filter(item => entryHasEpisodes(item.entry, 'tv') && item.percent < 100)
    .sort((a, b) => b.percent - a.percent)[0];

  const almostFinished = current
    .map(entry => ({
      entry,
      percent: computeProgressPercent(entry, entry.media_items!, 'tv') ?? 0,
    }))
    .filter(item => item.percent >= 85)
    .sort((a, b) => b.percent - a.percent)[0];

  const recent = completed[0];

  const serviceCounts: Record<string, number> = {};
  completed.forEach(entry => {
    const service = entry.selected_platform?.trim() ?? entry.media_items?.platforms?.find(Boolean);
    if (!service) {
      return;
    }
    serviceCounts[service] = (serviceCounts[service] ?? 0) + 1;
  });

  const topService = Object.entries(serviceCounts).sort(([, a], [, b]) => b - a)[0];

  const cards: CategorySpotlightCard[] = [];

  if (nextEpisodeReady) {
    cards.push({
      id: 'tv-next',
      title: 'Next episode ready',
      explanation: `You left ${
        resolveTitle(nextEpisodeReady.entry.media_items!) ?? 'this show'
      } with ${nextEpisodeReady.percent}% viewed, so another episode is queued.`,
      dataSubtitle: formatRelativeDistance(nextEpisodeReady.entry.updated_at),
      entry: buildSpotlightEntry(nextEpisodeReady.entry, 'tv', nextEpisodeReady.percent),
      ctaLabel: 'Continue the season',
    });
  } else {
    cards.push({
      id: 'tv-next-empty',
      title: 'Next episode ready',
      explanation: 'No current TV entries need a next episode prompt yet.',
      dataSubtitle: 'Keep watching to surface a ready-to-play show.',
    });
  }

  if (almostFinished) {
    cards.push({
      id: 'tv-almost',
      title: 'Almost finished',
      explanation: `You are ${almostFinished.percent}% through ${
        resolveTitle(almostFinished.entry.media_items!) ?? 'a show'
      }—close the season to lock it in.`,
      dataSubtitle: formatRelativeDistance(almostFinished.entry.updated_at),
      entry: buildSpotlightEntry(almostFinished.entry, 'tv', almostFinished.percent),
    });
  } else {
    cards.push({
      id: 'tv-almost-empty',
      title: 'Almost finished',
      explanation: 'No shows are above 85% yet. Push one further to unlock this insight.',
      dataSubtitle: 'Track progress to highlight a near-completion.',
    });
  }

  if (recent) {
    cards.push({
      id: 'tv-completed',
      title: 'Recently completed',
      explanation: 'You wrapped this show—nice viewing streak.',
      dataSubtitle: formatRelativeDistance(recent.updated_at),
      entry: buildSpotlightEntry(recent, 'tv'),
    });
  } else {
    cards.push({
      id: 'tv-completed-empty',
      title: 'Recently completed',
      explanation: 'Complete a series to showcase your latest TV win.',
      dataSubtitle: 'No completions yet.',
    });
  }

  cards.push({
    id: 'tv-platform',
    title: 'Service insight',
    explanation: topService
      ? `You finish ${topService[1]} shows on ${topService[0]}, so that service keeps you watching.`
      : 'Track more completions to spotlight your go-to service.',
    dataSubtitle: topService
      ? `${topService[0]} · ${topService[1]} completions`
      : 'Awaiting service data',
  });

  return ensureFourSpotlights(cards, 'tv');
}

function buildCompletionByGenre(entries: CategoryEntryRow[]): DropPattern {
  const buckets: Record<string, { total: number; completed: number }> = {};
  entries.forEach(entry => {
    const genres = entry.media_items?.genres ?? [];
    const genre = genres[0];
    if (!genre) {
      return;
    }
    const data = buckets[genre] ?? { total: 0, completed: 0 };
    data.total += 1;
    if (entry.status === 'completed') {
      data.completed += 1;
    }
    buckets[genre] = data;
  });

  const topGenre = Object.entries(buckets).sort(([, a], [, b]) => {
    const ratioA = a.total ? a.completed / a.total : 0;
    const ratioB = b.total ? b.completed / b.total : 0;
    return ratioB - ratioA;
  })[0];

  if (!topGenre) {
    return {
      explanation: 'No genre completions yet. Complete a few movies to unlock this insight.',
      subtitle: 'Awaiting genre data',
    };
  }

  const [genre, stats] = topGenre;
  const ratio = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  return {
    explanation: `You complete ${ratio}% of ${genre} movies you try.`,
    subtitle: `${stats.completed} / ${stats.total} completed`,
  };
}

function buildCategoryChart(
  category: DashboardCategoryKey,
  rows: CategoryChartRow[],
): CategoryChartPayload {
  const data = rows.map(row => ({
    label: row.day ? format(new Date(row.day), 'MMM d') : 'Unknown',
    completed: row.completed ?? 0,
    dropped: row.dropped ?? 0,
  }));

  const totalCompleted = data.reduce((sum, point) => sum + point.completed, 0);
  const totalDropped = data.reduce((sum, point) => sum + point.dropped, 0);
  const total = totalCompleted + totalDropped;

  const insight =
    total === 0
      ? `No ${CATEGORY_LABELS[category].toLowerCase()} completions recorded yet — log more entries to populate this chart.`
      : `You complete ${Math.round((totalCompleted / total) * 100)}% of ${CATEGORY_LABELS[category].toLowerCase()} entries because ${totalCompleted} were completed and ${totalDropped} were dropped recently.`;

  return {
    data,
    insight,
  };
}

function entryHasEpisodes(entry: CategoryEntryRow, category: DashboardCategoryKey): boolean {
  const media = entry.media_items;
  if (!media) {
    return false;
  }
  if (category === 'anime') {
    return Boolean(media.number_of_episodes ?? media.episodes);
  }
  if (category === 'manga') {
    return Boolean(media.volumes ?? media.chapters);
  }
  if (category === 'tv') {
    return Boolean(media.number_of_episodes ?? media.episodes);
  }
  return false;
}

type DropPattern = {
  explanation: string;
  subtitle: string;
};

function buildDropPattern(entries: CategoryEntryRow[]): DropPattern {
  const buckets: Record<string, { completed: number; dropped: number }> = {};
  for (const entry of entries) {
    const media = entry.media_items;
    const genres = media?.genres ?? [];
    if (!genres.length) {
      continue;
    }
    const genre = genres[0];
    const data = buckets[genre] ?? { completed: 0, dropped: 0 };
    if (entry.status === 'completed') {
      data.completed += 1;
    } else if (entry.status === 'dropped') {
      data.dropped += 1;
    }
    buckets[genre] = data;
  }

  const topGenre = Object.entries(buckets).sort(([, a], [, b]) => {
    const ratioA = a.dropped + a.completed === 0 ? 0 : a.dropped / (a.dropped + a.completed);
    const ratioB = b.dropped + b.completed === 0 ? 0 : b.dropped / (b.dropped + b.completed);
    return ratioB - ratioA;
  })[0];

  if (!topGenre) {
    return {
      explanation: 'Drop pattern not available yet. Complete or drop titles to surface a genre.',
      subtitle: 'Waiting for drop/completion data.',
    };
  }

  const [genre, stats] = topGenre;
  const total = stats.completed + stats.dropped;
  const ratio = total ? Math.round((stats.completed / total) * 100) : 0;
  return {
    explanation: `You keep ${genre} titles ${ratio}% complete versus dropped.`,
    subtitle: `${stats.completed} completed · ${stats.dropped} dropped`,
  };
}

// ============================================================================
// Media Suggestions Algorithm
// ============================================================================

/**
 * Normalizes a title by removing version-specific keywords
 * This helps detect similar games (e.g., "Alan Wake" vs "Alan Wake Remastered")
 */
function normalizeTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      // Remove common version keywords at the end
      .replace(
        /\s*:?\s*(remastered|remake|definitive edition|complete edition|enhanced edition|royal edition|scholar of the first sin|goty|game of the year edition|deluxe edition|ultimate edition)\s*$/i,
        '',
      )
      // Remove "Part X" or "Part I/II/III"
      .replace(/\s*:?\s*part\s+(\d+|i+|v+)\s*$/i, '')
      // Remove year editions like "2023" or "(2023)"
      .replace(/\s*[\(\[]?\d{4}[\)\]]?\s*$/i, '')
      .trim()
  );
}

/**
 * Checks if two titles are similar (likely the same game, different versions)
 */
function areTitlesSimilar(title1: string, title2: string): boolean {
  const normalized1 = normalizeTitle(title1);
  const normalized2 = normalizeTitle(title2);

  // Exact match after normalization
  if (normalized1 === normalized2) {
    return true;
  }

  // One is substring of the other (e.g., "Dark Souls II" in "Dark Souls II Scholar")
  const longer = normalized1.length > normalized2.length ? normalized1 : normalized2;
  const shorter = normalized1.length > normalized2.length ? normalized2 : normalized1;

  if (longer.startsWith(shorter) && longer.length - shorter.length < 10) {
    return true;
  }

  return false;
}

/**
 * Converts a title to a URL-friendly slug
 */
function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ============================================================================
// Series Detection Logic
// ============================================================================

type SeriesInfo = {
  isSeries: boolean;
  seriesName: string;
  sequenceNumber: number;
};

/**
 * Detects if a title is a sequel/numbered entry in a series
 * Returns series information if detected
 */
function detectSeries(title: string): SeriesInfo {
  const normalizedTitle = title.trim();

  // Pattern 1: Arabic numerals (e.g., "Dragon Age 2", "The Witcher 3")
  const arabicPattern = /^(.+?)\s+(\d+)(?:\s*[-:]\s*|\s+|$)/i;
  const arabicMatch = normalizedTitle.match(arabicPattern);
  if (arabicMatch) {
    const seriesName = arabicMatch[1].trim();
    const number = parseInt(arabicMatch[2], 10);
    if (number > 1 && number <= 10) {
      // Reasonable range for sequels
      return { isSeries: true, seriesName, sequenceNumber: number };
    }
  }

  // Pattern 2: Roman numerals (e.g., "Dark Souls II", "Final Fantasy VII")
  const romanPattern = /^(.+?)\s+(II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)(?:\s*[-:]\s*|\s+|$)/i;
  const romanMatch = normalizedTitle.match(romanPattern);
  if (romanMatch) {
    const seriesName = romanMatch[1].trim();
    const romanNumeral = romanMatch[2].toUpperCase();
    const romanToArabic: Record<string, number> = {
      II: 2,
      III: 3,
      IV: 4,
      V: 5,
      VI: 6,
      VII: 7,
      VIII: 8,
      IX: 9,
      X: 10,
      XI: 11,
      XII: 12,
    };
    const number = romanToArabic[romanNumeral];
    if (number && number > 1) {
      return { isSeries: true, seriesName, sequenceNumber: number };
    }
  }

  // Pattern 3: Words like "Part", "Chapter", "Episode" (e.g., "The Walking Dead: Episode 2")
  const partPattern = /^(.+?)\s*[-:]\s*(Part|Chapter|Episode|Season)\s+(\d+)/i;
  const partMatch = normalizedTitle.match(partPattern);
  if (partMatch) {
    const seriesName = partMatch[1].trim();
    const number = parseInt(partMatch[3], 10);
    if (number > 1 && number <= 20) {
      return { isSeries: true, seriesName, sequenceNumber: number };
    }
  }

  return { isSeries: false, seriesName: '', sequenceNumber: 0 };
}

type PrerequisiteCheckResult = {
  canRecommend: boolean;
  reason?: string;
  previousGameTitle?: string;
};

/**
 * Checks if user has played/completed previous games in the series
 * Returns whether prerequisites are met and the reason
 */
function checkSeriesPrerequisites(
  title: string,
  seriesInfo: SeriesInfo,
  userEntries: CategoryEntryRow[],
): PrerequisiteCheckResult {
  // If it's not a series, allow it
  if (!seriesInfo.isSeries) {
    return { canRecommend: true };
  }

  // For sequels (number > 1), check if previous games exist in library
  if (seriesInfo.sequenceNumber > 1) {
    // Look for ANY previous game in the series (could be numbered or unnumbered)
    const previousNumber = seriesInfo.sequenceNumber - 1;

    // Try to find previous game in user's library
    let foundEntry: CategoryEntryRow | null = null;
    let foundTitle = '';

    for (const entry of userEntries) {
      const media = entry.media_items;
      if (!media) {
        continue;
      }

      const entryTitle =
        media.title ??
        media.title_english ??
        media.title_romaji ??
        media.title_native ??
        media.original_title ??
        '';

      if (!entryTitle) {
        continue;
      }

      // Check if this entry matches the previous game in the series
      const entrySeriesInfo = detectSeries(entryTitle);

      // Strategy 1: Exact match - same series and previous number
      if (
        entrySeriesInfo.isSeries &&
        entrySeriesInfo.seriesName.toLowerCase() === seriesInfo.seriesName.toLowerCase() &&
        entrySeriesInfo.sequenceNumber === previousNumber
      ) {
        // Must be completed (not just current - they need to finish it first!)
        if (entry.status === 'completed') {
          foundEntry = entry;
          foundTitle = entryTitle;
          break;
        }
      }

      // Strategy 2: First game might not have a number (e.g., "Dragon Age: Origins")
      // Check if the title starts with the series name but has NO number
      if (seriesInfo.sequenceNumber === 2) {
        const normalizedEntry = entryTitle.toLowerCase();
        const normalizedSeriesName = seriesInfo.seriesName.toLowerCase();

        // Title starts with series name
        if (normalizedEntry.startsWith(normalizedSeriesName)) {
          // Check if it's NOT a numbered entry (to avoid matching "Dragon Age 3" when looking for prequel to "Dragon Age 2")
          if (!entrySeriesInfo.isSeries) {
            // This is likely the first game (unnumbered)
            if (entry.status === 'completed') {
              foundEntry = entry;
              foundTitle = entryTitle;
              break;
            }
          }
        }
      }

      // Strategy 3: Check if there's ANY game in the same series with lower sequence number
      if (
        entrySeriesInfo.isSeries &&
        entrySeriesInfo.seriesName.toLowerCase() === seriesInfo.seriesName.toLowerCase() &&
        entrySeriesInfo.sequenceNumber < seriesInfo.sequenceNumber
      ) {
        // Must be completed (not just current - they need to finish it first!)
        if (entry.status === 'completed') {
          foundEntry = entry;
          foundTitle = entryTitle;
          break;
        }
      }
    }

    // If previous game is found and completed, allow the sequel
    if (foundEntry && foundEntry.status === 'completed') {
      return {
        canRecommend: true,
        reason: `Ready for the next chapter - you completed ${foundTitle}`,
        previousGameTitle: foundTitle,
      };
    }

    // If previous game is not found or not played enough, block this sequel
    return { canRecommend: false };
  }

  return { canRecommend: true }; // First game in series is always allowed
}

/**
 * Generates a personalized reason for recommending a backlog item
 * based on user's genre/tag preferences
 */
function generateBacklogReason(
  media: NonNullable<CategoryEntryRow['media_items']>,
  userEntries: CategoryEntryRow[],
): string {
  const genres = media.genres ?? [];
  const tags = media.tags ?? [];

  // Analyze user's completed/favorite games to find preferred genres/tags
  const genreCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();

  for (const entry of userEntries) {
    const entryMedia = entry.media_items;
    if (!entryMedia) {
      continue;
    }

    // ONLY count games you've actually played (completed or current)
    // Skip planned (0 hours) and dropped games
    if (entry.status === 'planned') {
      continue;
    } // Skip backlog items - not played yet!
    if (entry.status === 'dropped') {
      continue;
    } // Skip dropped games

    // Weight completed and favorite games more heavily
    let weight = 1;
    if (entry.status === 'completed') {
      weight = 3;
    }
    if (entry.is_favorite) {
      weight = 4;
    }

    // Factor in hours played (progress) - more hours = more engagement
    const hours = Math.max(0, entry.progress ?? 0);
    // Hours multiplier: 10h=1.5x, 20h=2x, 50h=3.5x, 100h=6x, 200h=11x
    // This heavily boosts genres from games you spent a lot of time in
    const hoursMultiplier = 1 + hours / 20;
    weight *= hoursMultiplier;

    // Count genres
    for (const genre of entryMedia.genres ?? []) {
      if (!genre) {
        continue;
      }
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + weight);
    }

    // Count tags (limit to avoid noise)
    const entryTags = (entryMedia.tags ?? []).slice(0, 5);
    for (const tag of entryTags) {
      if (!tag) {
        continue;
      }
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + weight);
    }
  }

  // Find matching genres/tags between this game and user's preferences
  // ONLY show genres that are significant (at least 50% of your top genre's weight AND positive)
  const sortedGenres = genres
    .filter(g => g && (genreCounts.get(g) ?? 0) > 0) // ONLY positive weights
    .sort((a, b) => (genreCounts.get(b) ?? 0) - (genreCounts.get(a) ?? 0));

  // Calculate threshold: 50% of top genre's weight (stricter filtering)
  const topGenreWeight = sortedGenres.length > 0 ? (genreCounts.get(sortedGenres[0]) ?? 0) : 0;
  const genreThreshold = topGenreWeight * 0.5;

  const matchingGenres = sortedGenres
    .filter(g => (genreCounts.get(g) ?? 0) >= genreThreshold)
    .slice(0, 2);

  // Same for tags: 50% threshold AND positive weight
  const sortedTags = tags
    .filter(t => t && (tagCounts.get(t) ?? 0) > 0) // ONLY positive weights
    .sort((a, b) => (tagCounts.get(b) ?? 0) - (tagCounts.get(a) ?? 0));

  const topTagWeight = sortedTags.length > 0 ? (tagCounts.get(sortedTags[0]) ?? 0) : 0;
  const tagThreshold = topTagWeight * 0.5;

  const matchingTags = sortedTags.filter(t => (tagCounts.get(t) ?? 0) >= tagThreshold).slice(0, 2);

  // Generate reason based on matches
  if (matchingGenres.length > 0 && matchingTags.length > 0) {
    return `You enjoy ${matchingGenres.join(' & ')} with ${matchingTags[0]}`;
  } else if (matchingGenres.length > 0) {
    return `You enjoy ${matchingGenres.join(' & ')} games`;
  } else if (matchingTags.length > 0) {
    return `Matches your interest in ${matchingTags.join(' & ')}`;
  } else {
    // Fallback: check if it's a popular genre
    const popularGenres = genres.slice(0, 2).filter(Boolean);
    if (popularGenres.length > 0) {
      return `${popularGenres.join(' & ')} game in your backlog`;
    }
    return 'In your backlog - ready to start';
  }
}

type UserPreferences = {
  favoriteGenres: Map<string, number>; // genre -> weight (can be negative for dropped)
  favoriteTags: Map<string, number>; // tag -> weight
  userBucketWeights: Record<InsightTagBucket, Map<string, number>>;
  droppedGenreCombinations: Set<string>; // stringified genre arrays from dropped games
  droppedSubgenreCombinations: Set<string>;
  droppedSubgenreCounts: Map<string, number>;
  averageRating: number;
  completedCount: number;
  totalEntries: number;
};

type CandidateItem = {
  id: number;
  category: string | null;
  title: string | null;
  title_english: string | null;
  title_romaji: string | null;
  title_native: string | null;
  original_title: string | null;
  cover_image_large: string | null;
  cover_image_medium: string | null;
  genres: string[] | null;
  tags: string[] | null;
  candidateBucketTags?: Partial<Record<InsightTagBucket, string[]>>;
};

type GameSuggestionContributor = {
  bucket: InsightTagBucket | 'genre';
  label: string;
  weightedScore: number;
};

type GameScoreResult = {
  score: number;
  contributors: GameSuggestionContributor[];
};

const GAME_BUCKET_CHANNEL_WEIGHTS: Record<InsightTagBucket, number> = {
  subgenre: 0,
  mechanic: 0,
  mood: 0,
  theme: 0,
  structure: 0,
};
const GAME_GENRE_FALLBACK_WEIGHT = 0.05;
const GAME_DROPPED_SUBGENRE_BLOCK_THRESHOLD = 2;
const GAME_DROPPED_SUBGENRE_PENALTY = 0.35;
const GAME_REQUIRED_SUBGENRE_POSITIVE_MATCH = 0.2;
const GAME_MIN_EXTERNAL_CONFIDENCE = 0.5;
const DEBUG_GAME_SUGGESTIONS = process.env.DEBUG_GAME_SUGGESTIONS === '1';
const DASHBOARD_SUGGESTIONS_DEBUG =
  process.env.DASHBOARD_SUGGESTIONS_DEBUG === '1' || DEBUG_GAME_SUGGESTIONS;
const DASHBOARD_SUGGESTIONS_TARGET_TITLE = (
  process.env.DASHBOARD_SUGGESTIONS_TARGET_TITLE ?? ''
).trim();

function truncateDebugString(value: string, maxLen = 240): string {
  return value.length > maxLen ? `${value.slice(0, maxLen)}...` : value;
}

function safeDebugJson(value: unknown): string {
  try {
    return JSON.stringify(
      value,
      (_key, val) => {
        if (typeof val === 'string') {
          return truncateDebugString(val, 180);
        }
        return val;
      },
      2,
    );
  } catch {
    return '[unserializable]';
  }
}

function dbg(..._args: unknown[]) {}

function dbgTable(_label: string, _rows: Array<Record<string, unknown>>) {}

function toSafeListPreview(values: string[], max = 5): string[] {
  return values.slice(0, max).map(value => truncateDebugString(value, 120));
}

function formatTagsForDebug(tags: unknown): string {
  if (!Array.isArray(tags)) {
    return '';
  }
  const values: string[] = [];
  for (const tag of tags) {
    if (typeof tag === 'string') {
      const value = tag.trim();
      if (value) {
        values.push(value);
      }
      continue;
    }
    if (!tag || typeof tag !== 'object') {
      continue;
    }
    const record = tag as Record<string, unknown>;
    const value =
      typeof record.name === 'string' && record.name.trim()
        ? record.name.trim()
        : typeof record.slug === 'string' && record.slug.trim()
          ? record.slug.trim()
          : '';
    if (value) {
      values.push(value);
    }
  }
  return Array.from(new Set(values)).join(', ');
}

function resolveCandidateTitle(candidate: CandidateItem): string {
  return (
    candidate.title ??
    candidate.title_english ??
    candidate.title_romaji ??
    candidate.title_native ??
    candidate.original_title ??
    'Untitled'
  );
}

function isTargetTitleMatch(title: string): boolean {
  if (!DASHBOARD_SUGGESTIONS_TARGET_TITLE) {
    return false;
  }
  return title.toLowerCase().includes(DASHBOARD_SUGGESTIONS_TARGET_TITLE.toLowerCase());
}

function normalizePreferenceLabel(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function createEmptyBucketWeightMaps(): Record<InsightTagBucket, Map<string, number>> {
  return {
    subgenre: new Map(),
    mechanic: new Map(),
    mood: new Map(),
    theme: new Map(),
    structure: new Map(),
  };
}

function getFavoriteRankMultiplier(pinnedRank?: number | null): number {
  if (typeof pinnedRank !== 'number' || !Number.isFinite(pinnedRank) || pinnedRank <= 0) {
    return 1.1;
  }
  const rank = Math.min(10, Math.max(1, Math.round(pinnedRank)));
  return 1.35 - (rank - 1) * 0.035;
}

/**
 * Analyzes user's entries to extract preferences
 */
function analyzeUserPreferences(
  entries: CategoryEntryRow[],
  gameTagMap?: Map<number, Partial<Record<InsightTagBucket, string[]>>>,
): UserPreferences {
  const isGamesMode = Boolean(gameTagMap);
  const genreWeights = new Map<string, number>();
  const tagWeights = new Map<string, number>();
  const userBucketWeights = createEmptyBucketWeightMaps();
  const droppedGenreCombinations = new Set<string>();
  const droppedSubgenreCombinations = new Set<string>();
  const droppedSubgenreCounts = new Map<string, number>();
  let totalRating = 0;
  let ratingCount = 0;
  const completedCount = entries.filter(e => e.status === 'completed').length;

  for (const entry of entries) {
    const media = entry.media_items;
    if (!media) {
      continue;
    }

    const genres = media.genres ?? [];
    const isDropped = entry.status === 'dropped';

    // Track dropped genre combinations
    if (isDropped && genres.length > 0) {
      const genreKey = genres.filter(Boolean).sort().join('|');
      droppedGenreCombinations.add(genreKey);
    }

    const isPositiveTaste = entry.status === 'completed' || entry.status === 'current';
    if (!isPositiveTaste && !isDropped) {
      continue;
    }

    // Weight based on status and rating
    let weight = 1;
    if (entry.status === 'completed') {
      weight = entry.is_favorite ? 4 : 3;
    } else if (entry.status === 'current') {
      weight = entry.is_favorite ? 3 : 2;
    } else if (isDropped) {
      weight = -2; // NEGATIVE weight for dropped
    }

    // Higher rating = more weight
    if (entry.score !== null && entry.score !== undefined && isPositiveTaste) {
      weight *= entry.score / 5; // Normalize to 0-2 range
      totalRating += entry.score;
      ratingCount++;
    }

    if (isPositiveTaste && entry.is_favorite) {
      weight *= getFavoriteRankMultiplier(entry.pinned_rank);
    }

    // Count genres (can be negative for dropped)
    for (const genre of genres) {
      if (!genre) {
        continue;
      }
      genreWeights.set(genre, (genreWeights.get(genre) ?? 0) + weight);
    }

    // For games, tags come from bucket links and should not contribute to favoriteTags.
    if (!isGamesMode) {
      const tags = extractTasteTagLabelsFromMediaTags(media.tags);
      for (const tag of tags) {
        tagWeights.set(tag, (tagWeights.get(tag) ?? 0) + weight);
      }
    }

    const mediaId = entry.media_items?.id;
    if (typeof mediaId === 'number' && gameTagMap?.has(mediaId)) {
      const bucketTags = gameTagMap.get(mediaId) ?? {};
      const normalizedSubgenres = (bucketTags.subgenre ?? [])
        .map(normalizePreferenceLabel)
        .filter(Boolean);
      if (isDropped && normalizedSubgenres.length > 0) {
        droppedSubgenreCombinations.add([...normalizedSubgenres].sort().join('|'));
      }
      for (const bucket of INSIGHT_TAG_BUCKETS) {
        const labels = (bucketTags[bucket] ?? []).map(normalizePreferenceLabel).filter(Boolean);
        for (const label of labels) {
          const map = userBucketWeights[bucket];
          map.set(label, (map.get(label) ?? 0) + weight);
          if (isDropped && bucket === 'subgenre') {
            droppedSubgenreCounts.set(label, (droppedSubgenreCounts.get(label) ?? 0) + 1);
          }
        }
      }
    }
  }

  return {
    favoriteGenres: genreWeights,
    favoriteTags: tagWeights,
    userBucketWeights,
    droppedGenreCombinations,
    droppedSubgenreCombinations,
    droppedSubgenreCounts,
    averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
    completedCount,
    totalEntries: entries.length,
  };
}

/**
 * Scores a candidate item based on user preferences
 */
function scoreCandidateItem(candidate: CandidateItem, preferences: UserPreferences): number {
  const candidateGenres = (candidate.genres ?? []).filter(Boolean);
  const candidateTags = (candidate.tags ?? []).filter(Boolean);

  // Check if this exact genre combination was dropped
  const genreKey = candidateGenres.sort().join('|');
  if (genreKey && preferences.droppedGenreCombinations.has(genreKey)) {
    return 0; // Don't suggest games with exact same genre combo as dropped games
  }

  let score = 0;
  let maxScore = 0;

  // Genre matching (50% weight) - can be negative!
  let genreScore = 0;
  for (const genre of candidateGenres) {
    const weight = preferences.favoriteGenres.get(genre) ?? 0;
    genreScore += weight;
  }
  score += genreScore * 0.5;

  // Calculate max possible genre score (only positive weights)
  const positiveGenreWeights = Array.from(preferences.favoriteGenres.values())
    .filter(w => w > 0)
    .sort((a, b) => b - a)
    .slice(0, 3);
  maxScore += positiveGenreWeights.reduce((sum, w) => sum + w * 0.5, 0);

  // Tag matching (20% weight) - only if tags exist
  if (candidateTags.length > 0 && preferences.favoriteTags.size > 0) {
    let tagScore = 0;
    for (const tag of candidateTags) {
      const weight = preferences.favoriteTags.get(tag) ?? 0;
      if (weight > 0) {
        tagScore += weight;
      }
    }
    score += tagScore * 0.2;

    const positiveTagWeights = Array.from(preferences.favoriteTags.values())
      .filter(w => w > 0)
      .sort((a, b) => b - a)
      .slice(0, 3);
    maxScore += positiveTagWeights.reduce((sum, w) => sum + w * 0.2, 0);
  }

  // Bonus for multiple POSITIVE genre matches (20% weight)
  const positiveGenreMatches = candidateGenres.filter(g => {
    const weight = preferences.favoriteGenres.get(g) ?? 0;
    return weight > 0;
  }).length;
  if (positiveGenreMatches > 1) {
    score += positiveGenreMatches * 2 * 0.2;
    maxScore += 6 * 0.2; // Max 3 matches * 2
  }

  // Penalty if ANY genre has negative weight from dropped games (10% weight)
  const hasNegativeGenre = candidateGenres.some(g => {
    const weight = preferences.favoriteGenres.get(g) ?? 0;
    return weight < 0;
  });
  if (hasNegativeGenre) {
    score -= maxScore * 0.1; // 10% penalty
  }

  // Heavy penalty for genres with zero or negative engagement
  const zeroEngagementGenres = candidateGenres.filter(g => {
    const weight = preferences.favoriteGenres.get(g) ?? 0;
    return weight <= 0; // Zero or negative weight
  });
  if (zeroEngagementGenres.length > 0 && candidateGenres.length > 0) {
    // Penalty scales: 1/2 genres = 35%, 2/2 genres = 70%
    const proportion = zeroEngagementGenres.length / candidateGenres.length;
    const penalty = proportion * 0.7;
    score -= score * penalty;
  }

  // Normalize to 0-1 range
  if (maxScore <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(1, score / maxScore));
}

function hasPositiveBucketPreference(preferences: UserPreferences): boolean {
  return INSIGHT_TAG_BUCKETS.some(bucket =>
    Array.from(preferences.userBucketWeights[bucket].values()).some(weight => weight > 0),
  );
}

function scoreLabelsAgainstPreferenceMap(
  labels: string[],
  preferenceMap: Map<string, number>,
): { positive: number; negative: number; contributors: Array<{ label: string; score: number }> } {
  if (labels.length === 0) {
    return { positive: 0, negative: 0, contributors: [] };
  }

  const uniqueLabels = Array.from(new Set(labels.map(normalizePreferenceLabel).filter(Boolean)));
  if (uniqueLabels.length === 0) {
    return { positive: 0, negative: 0, contributors: [] };
  }

  const positiveWeights = Array.from(preferenceMap.values()).filter(weight => weight > 0);
  const negativeWeights = Array.from(preferenceMap.values()).filter(weight => weight < 0);
  const maxPositiveWeight = positiveWeights.length > 0 ? Math.max(...positiveWeights) : 0;
  const maxNegativeWeight =
    negativeWeights.length > 0 ? Math.max(...negativeWeights.map(weight => Math.abs(weight))) : 0;

  let positiveRaw = 0;
  let negativeRaw = 0;
  const contributors: Array<{ label: string; score: number }> = [];

  for (const label of uniqueLabels) {
    const weight = preferenceMap.get(label) ?? 0;
    if (weight > 0 && maxPositiveWeight > 0) {
      const normalizedScore = Math.min(1, weight / maxPositiveWeight);
      positiveRaw += normalizedScore;
      contributors.push({ label, score: normalizedScore });
      continue;
    }
    if (weight < 0 && maxNegativeWeight > 0) {
      negativeRaw += Math.min(1, Math.abs(weight) / maxNegativeWeight);
    }
  }

  const normalizationBase = Math.max(1, Math.min(uniqueLabels.length, 2));
  return {
    positive: Math.min(1, positiveRaw / normalizationBase),
    negative: Math.min(1, negativeRaw / normalizationBase),
    contributors,
  };
}

function scoreCandidateItemGames(
  candidate: CandidateItem,
  preferences: UserPreferences,
  candidateBucketTags: Partial<Record<InsightTagBucket, string[]>>,
): GameScoreResult {
  const candidateTitle = resolveCandidateTitle(candidate);
  const targetMatch = isTargetTitleMatch(candidateTitle);
  const candidateGenres = (candidate.genres ?? []).filter(Boolean);
  const subgenres = (candidateBucketTags.subgenre ?? [])
    .map(normalizePreferenceLabel)
    .filter(Boolean);
  const subgenreKey = subgenres.length > 0 ? [...subgenres].sort().join('|') : '';
  if (targetMatch) {
    const bucketSummary = INSIGHT_TAG_BUCKETS.map(bucket => ({
      bucket,
      count: (candidateBucketTags[bucket] ?? []).length,
      sample: toSafeListPreview(candidateBucketTags[bucket] ?? [], 3),
    }));
    dbg(
      `[TARGET:${DASHBOARD_SUGGESTIONS_TARGET_TITLE}] bucket summary for "${candidateTitle}"`,
      safeDebugJson(bucketSummary),
    );
  }
  if (subgenreKey && preferences.droppedSubgenreCombinations.has(subgenreKey)) {
    if (targetMatch) {
      dbg(
        `[TARGET:${DASHBOARD_SUGGESTIONS_TARGET_TITLE}] excluded by droppedSubgenreCombinations`,
        { candidateTitle, subgenreKey },
      );
    }
    return { score: 0, contributors: [] };
  }
  const blockedDroppedSubgenres = Array.from(new Set(subgenres)).filter(
    subgenre =>
      (preferences.droppedSubgenreCounts.get(subgenre) ?? 0) >=
      GAME_DROPPED_SUBGENRE_BLOCK_THRESHOLD,
  );
  if (targetMatch) {
    dbg(`[TARGET:${DASHBOARD_SUGGESTIONS_TARGET_TITLE}] dropped subgenre checks`, {
      candidateTitle,
      blockedDroppedSubgenres,
      droppedSubgenreCombinationHit: Boolean(
        subgenreKey && preferences.droppedSubgenreCombinations.has(subgenreKey),
      ),
    });
  }
  if (subgenres.length > 0 && blockedDroppedSubgenres.length === subgenres.length) {
    if (targetMatch) {
      dbg(`[TARGET:${DASHBOARD_SUGGESTIONS_TARGET_TITLE}] excluded by blockedDroppedSubgenres`, {
        candidateTitle,
        subgenres,
        blockedDroppedSubgenres,
      });
    }
    return { score: 0, contributors: [] };
  }

  let positiveScore = 0;
  let negativePenalty = 0;
  const contributors: GameSuggestionContributor[] = [];
  let subgenrePositiveSignal = 0;

  for (const bucket of INSIGHT_TAG_BUCKETS) {
    const channelWeight = GAME_BUCKET_CHANNEL_WEIGHTS[bucket];
    const bucketLabels = candidateBucketTags[bucket] ?? [];
    const channelResult = scoreLabelsAgainstPreferenceMap(
      bucketLabels,
      preferences.userBucketWeights[bucket],
    );
    if (bucket === 'subgenre') {
      subgenrePositiveSignal = channelResult.positive;
    }
    positiveScore += channelResult.positive * channelWeight;
    negativePenalty += channelResult.negative * channelWeight;
    for (const contributor of channelResult.contributors) {
      contributors.push({
        bucket,
        label: contributor.label,
        weightedScore: contributor.score * channelWeight,
      });
    }
  }

  if (candidateGenres.length > 0) {
    const genreResult = scoreLabelsAgainstPreferenceMap(
      candidateGenres,
      preferences.favoriteGenres,
    );
    positiveScore += genreResult.positive * GAME_GENRE_FALLBACK_WEIGHT;
    negativePenalty += genreResult.negative * GAME_GENRE_FALLBACK_WEIGHT;
    for (const contributor of genreResult.contributors) {
      contributors.push({
        bucket: 'genre',
        label: contributor.label,
        weightedScore: contributor.score * GAME_GENRE_FALLBACK_WEIGHT,
      });
    }
  }

  if (blockedDroppedSubgenres.length > 0) {
    const severity = blockedDroppedSubgenres.length / Math.max(1, subgenres.length);
    negativePenalty += GAME_DROPPED_SUBGENRE_PENALTY * severity;
  }

  const hasSubgenreData = subgenres.length > 0;
  if (hasSubgenreData && subgenrePositiveSignal < GAME_REQUIRED_SUBGENRE_POSITIVE_MATCH) {
    if (targetMatch) {
      dbg(`[TARGET:${DASHBOARD_SUGGESTIONS_TARGET_TITLE}] excluded by subgenre threshold`, {
        candidateTitle,
        hasSubgenreData,
        subgenrePositiveSignal,
        required: GAME_REQUIRED_SUBGENRE_POSITIVE_MATCH,
      });
    }
    return { score: 0, contributors: [] };
  }

  const score = Math.max(0, Math.min(1, positiveScore - negativePenalty));
  const rankedContributors = contributors
    .filter(contributor => contributor.weightedScore > 0)
    .sort((a, b) => {
      const bucketPriorityA = a.bucket === 'subgenre' ? 1 : 0;
      const bucketPriorityB = b.bucket === 'subgenre' ? 1 : 0;
      if (bucketPriorityB !== bucketPriorityA) {
        return bucketPriorityB - bucketPriorityA;
      }
      return b.weightedScore - a.weightedScore;
    });

  if (targetMatch) {
    dbg(`[TARGET:${DASHBOARD_SUGGESTIONS_TARGET_TITLE}] scoreCandidateItemGames result`, {
      candidateTitle,
      subgenrePositiveSignal,
      hasSubgenreData,
      blockedDroppedSubgenres,
      score: Number(score.toFixed(4)),
      topContributors: rankedContributors.slice(0, 5).map(item => ({
        bucket: item.bucket,
        label: item.label,
        weightedScore: Number(item.weightedScore.toFixed(4)),
      })),
    });
  }

  return { score, contributors: rankedContributors };
}

function buildGameRecommendationReason(contributors: GameSuggestionContributor[]): string {
  if (contributors.length === 0) {
    return 'Based on your game taste profile';
  }

  const uniqueByLabel = new Set<string>();
  const selected: string[] = [];

  for (const contributor of contributors) {
    const key = `${contributor.bucket}:${contributor.label}`;
    if (uniqueByLabel.has(key)) {
      continue;
    }
    uniqueByLabel.add(key);
    selected.push(formatTasteProfileLabel(contributor.label));
    if (selected.length >= 2) {
      break;
    }
  }

  if (selected.length === 0) {
    return 'Based on your game taste profile';
  }
  if (selected.length === 1) {
    return `Because you love ${selected[0]}`;
  }
  return `Because you love ${selected[0]} + ${selected[1]}`;
}

/**
 * Builds media suggestions for a category
 * Strategy:
 * - exactly 4 items total when possible
 * - 2 items from user's backlog
 * - 2 common-knowledge picks from the global database, excluding user's own lists
 */
async function buildMediaSuggestions(
  supabase: DashboardSupabaseClient,
  userId: string,
  category: DashboardCategoryKey,
  userEntries: CategoryEntryRow[],
  options?: {
    maxSuggestions?: number;
    maxBacklogSuggestions?: number;
  },
): Promise<MediaSuggestion[]> {
  const targetTitle = DASHBOARD_SUGGESTIONS_TARGET_TITLE.toLowerCase();
  const hasTarget = targetTitle.length > 0;
  dbg('buildMediaSuggestions:start', {
    category,
    userId,
    userEntriesCount: userEntries.length,
    targetTitle: hasTarget ? DASHBOARD_SUGGESTIONS_TARGET_TITLE : '(none)',
  });

  if (category === 'games') {
    const completedGames = userEntries
      .filter(entry => entry.status === 'completed')
      .map(entry => {
        const media = entry.media_items;
        const title =
          media?.title ??
          media?.title_english ??
          media?.title_romaji ??
          media?.title_native ??
          media?.original_title ??
          `media_id:${entry.media_items?.id ?? 'unknown'}`;

        return {
          mediaId: media?.id ?? null,
          title,
          isFavorite: Boolean(entry.is_favorite),
          favoriteRank: entry.pinned_rank ?? null,
          score: entry.score ?? null,
          hours: entry.progress ?? 0,
          genres: media?.genres ?? [],
          tags: media?.tags ?? [],
        };
      });

    dbg('[Games Suggestions] Completed games count', completedGames.length);
    dbgTable(
      '[Games Suggestions] Completed games table',
      completedGames.map(game => ({
        mediaId: game.mediaId,
        title: game.title,
        isFavorite: game.isFavorite,
        favoriteRank: game.favoriteRank,
        score: game.score,
        hours: game.hours,
        genres: game.genres.join(', '),
        tags: formatTagsForDebug(game.tags),
      })),
    );

    dbgTable(
      'User entries data-shape sanity (first 5)',
      userEntries.slice(0, 5).map(entry => {
        const media = entry.media_items;
        const firstTag = Array.isArray(media?.tags) ? media?.tags[0] : undefined;
        return {
          title:
            media?.title ??
            media?.title_english ??
            media?.title_romaji ??
            media?.title_native ??
            media?.original_title ??
            '(untitled)',
          genresType: typeof media?.genres,
          genresIsArray: Array.isArray(media?.genres),
          genresSample: Array.isArray(media?.genres) ? safeDebugJson(media.genres.slice(0, 2)) : '',
          tagsType: typeof media?.tags,
          tagsIsArray: Array.isArray(media?.tags),
          tagsSample:
            Array.isArray(media?.tags) && media.tags.length > 0 ? safeDebugJson(media.tags[0]) : '',
          tagObjectKeys:
            firstTag && typeof firstTag === 'object' && !Array.isArray(firstTag)
              ? Object.keys(firstTag as Record<string, unknown>)
                  .slice(0, 12)
                  .join(',')
              : '',
        };
      }),
    );
  }

  const suggestions: MediaSuggestion[] = [];
  const maxSuggestions = options?.maxSuggestions ?? 4;
  const maxBacklogSuggestions = options?.maxBacklogSuggestions ?? 2;

  // ============================================================================
  // PART 1: Backlog suggestions
  // ============================================================================
  const backlogEntries = userEntries.filter(entry => entry.status === 'planned');

  if (backlogEntries.length > 0 && maxBacklogSuggestions > 0) {
    // Sort by priority (if exists) or updated_at
    const sortedBacklog = backlogEntries.sort((a, b) => {
      const priorityA = (a as unknown as { priority?: number }).priority ?? 0;
      const priorityB = (b as unknown as { priority?: number }).priority ?? 0;
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return dateB - dateA;
    });

    // Take up to 2 from backlog, but filter out sequels without prerequisites
    for (const entry of sortedBacklog) {
      if (suggestions.length >= maxBacklogSuggestions) {
        break;
      }

      const media = entry.media_items;
      if (!media) {
        continue;
      }

      const title =
        media.title ??
        media.title_english ??
        media.title_romaji ??
        media.title_native ??
        media.original_title ??
        'Untitled';

      // Check if this is a sequel that requires previous games
      const seriesInfo = detectSeries(title);
      const prerequisiteCheck = checkSeriesPrerequisites(title, seriesInfo, userEntries);
      if (hasTarget && title.toLowerCase().includes(targetTitle)) {
        dbg(`[TARGET:${DASHBOARD_SUGGESTIONS_TARGET_TITLE}] backlog series check`, {
          title,
          seriesInfo,
          prerequisiteCheck,
        });
      }

      // Skip if it's a sequel without prerequisites played
      if (!prerequisiteCheck.canRecommend) {
        dbg(`Skipping "${title}" - previous game in series not played/completed`);
        continue;
      }

      // Determine reason based on priority and series status
      let reason = 'In your backlog - ready to start';
      if (prerequisiteCheck.reason) {
        // If it's a sequel, use the series-specific reason
        reason = prerequisiteCheck.reason;
      } else if (
        (entry as unknown as { priority?: number }).priority &&
        (entry as unknown as { priority?: number }).priority! >= 50
      ) {
        // High priority item
        reason = 'High priority in your backlog';
      } else {
        // Generate personalized reason based on user's genre/tag preferences
        reason = generateBacklogReason(media, userEntries);
      }

      suggestions.push({
        mediaId: media.id,
        category,
        title,
        cover: media.cover_image_large ?? media.cover_image_medium ?? DEFAULT_COVER,
        slug: titleToSlug(title),
        reason,
        confidence: 1.0, // 100% confidence - it's in their backlog!
        genres: media.genres ?? [],
        tags: media.tags ?? [],
      });
    }
  }

  const normalizeGenreKey = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
  const droppedGenreCounts = new Map<string, number>();
  const activeGenreCounts = new Map<string, number>();

  for (const entry of userEntries) {
    const genres = entry.media_items?.genres ?? [];
    for (const genre of genres) {
      if (!genre) {
        continue;
      }
      const key = normalizeGenreKey(genre);
      if (!key) {
        continue;
      }
      if (entry.status === 'dropped') {
        droppedGenreCounts.set(key, (droppedGenreCounts.get(key) ?? 0) + 1);
        continue;
      }
      if (entry.status === 'current' || entry.status === 'completed') {
        activeGenreCounts.set(key, (activeGenreCounts.get(key) ?? 0) + 1);
      }
    }
  }

  const resilientDroppedGenres = new Set(
    Array.from(droppedGenreCounts.entries())
      .filter(
        ([genre, droppedCount]) => droppedCount >= 1 && (activeGenreCounts.get(genre) ?? 0) >= 1,
      )
      .map(([genre]) => genre),
  );

  // ============================================================================
  // PART 2: Database-driven suggestions
  // ============================================================================
  const neededExternal = maxSuggestions - suggestions.length; // Fill up to max total

  if (neededExternal > 0) {
    // 1. Fetch ALL media IDs for exclusion
    const { data: allUserEntries, error: entriesError } = await supabase
      .from('user_media_entries')
      .select('media_id, media_items!inner(category)')
      .eq('user_id', userId)
      .eq('media_items.category', category);

    if (!entriesError && allUserEntries) {
      const existingMediaIds = new Set(
        allUserEntries
          .map(entry => entry.media_id)
          .filter((id): id is number => id !== null && id !== undefined),
      );
      dbg('external-pool:existingMediaIds', {
        count: existingMediaIds.size,
        sample: Array.from(existingMediaIds).slice(0, 12),
      });

      // 2. Fetch ALL existing titles for similarity check (no limit!)
      const { data: allUserMedia, error: mediaError } = await supabase
        .from('user_media_entries')
        .select(
          'media_items!inner(title, title_english, title_romaji, title_native, original_title)',
        )
        .eq('user_id', userId)
        .eq('media_items.category', category);

      if (mediaError || !allUserMedia) {
        return suggestions; // Return backlog suggestions if any
      }

      const existingTitles = allUserMedia
        .map(entry => {
          const media = (
            entry as unknown as {
              media_items: {
                title: string | null;
                title_english: string | null;
                title_romaji: string | null;
                title_native: string | null;
                original_title: string | null;
              };
            }
          ).media_items;
          if (!media) {
            return null;
          }
          return (
            media.title ??
            media.title_english ??
            media.title_romaji ??
            media.title_native ??
            media.original_title
          );
        })
        .filter((title): title is string => title !== null && title !== undefined);
      dbg('external-pool:existingTitles', {
        count: existingTitles.length,
        sample: toSafeListPreview(existingTitles, 8),
      });

      let userGameTagMap: Map<number, Partial<Record<InsightTagBucket, string[]>>> | undefined;
      if (category === 'games') {
        const userMediaIds = userEntries
          .map(entry => entry.media_items?.id)
          .filter((mediaId): mediaId is number => typeof mediaId === 'number');
        userGameTagMap = await fetchGameInsightTagMap(supabase, userMediaIds);
      }

      // 3. Analyze user preferences
      const preferences = analyzeUserPreferences(userEntries, userGameTagMap);
      if (category === 'games' && DASHBOARD_SUGGESTIONS_DEBUG) {
        const tagWeightKeys = Array.from(preferences.favoriteTags.keys());
        const objectObjectCount = tagWeightKeys.filter(
          key => key === '[object Object]' || /object Object/i.test(key),
        ).length;
        dbg('[Games Suggestions] tagWeights guard', {
          tagWeightsSize: preferences.favoriteTags.size,
          objectObjectCount,
        });
      }
      const hasPreferenceSignal =
        preferences.favoriteGenres.size > 0 ||
        preferences.favoriteTags.size > 0 ||
        (category === 'games' && hasPositiveBucketPreference(preferences));
      dbg('preference-signal', {
        category,
        hasPreferenceSignal,
        favoriteGenresCount: preferences.favoriteGenres.size,
        favoriteTagsCount: preferences.favoriteTags.size,
      });

      if (hasPreferenceSignal || category.length > 0) {
        // 4. Fetch candidate items from database (exclude user's items)
        let candidatesQuery = supabase.from('media_items').select(
          `
            id,
            category,
            title,
            title_english,
            title_romaji,
            title_native,
            original_title,
            cover_image_large,
            cover_image_medium,
            genres,
            tags
          `,
        );

        candidatesQuery = candidatesQuery.eq('category', category).limit(300);
        if (existingMediaIds.size > 0) {
          candidatesQuery = candidatesQuery.not(
            'id',
            'in',
            `(${Array.from(existingMediaIds).join(',')})`,
          );
        }

        const { data: candidates, error } = await candidatesQuery;

        if (!error && candidates && candidates.length > 0) {
          const candidateIds = candidates
            .map(candidate => candidate.id)
            .filter((candidateId): candidateId is number => typeof candidateId === 'number');
          const { data: popularityRows } = await supabase
            .from('user_media_entries')
            .select('media_id,status,is_favorite,score')
            .in('media_id', candidateIds);

          const popularityByMediaId = new Map<
            number,
            {
              tracked: number;
              completed: number;
              favorites: number;
              scoreSum: number;
              scoreCount: number;
            }
          >();
          for (const row of popularityRows ?? []) {
            const mediaId = (row as { media_id: number | null }).media_id;
            if (typeof mediaId !== 'number') {
              continue;
            }
            const stats = popularityByMediaId.get(mediaId) ?? {
              tracked: 0,
              completed: 0,
              favorites: 0,
              scoreSum: 0,
              scoreCount: 0,
            };
            stats.tracked += 1;
            if ((row as { status?: string | null }).status === 'completed') {
              stats.completed += 1;
            }
            if ((row as { is_favorite?: boolean | null }).is_favorite) {
              stats.favorites += 1;
            }
            const rawScore = (row as { score?: number | string | null }).score;
            const parsedScore =
              typeof rawScore === 'number'
                ? rawScore
                : typeof rawScore === 'string' && rawScore.trim() !== ''
                  ? Number(rawScore)
                  : null;
            if (parsedScore !== null && Number.isFinite(parsedScore)) {
              stats.scoreSum += parsedScore;
              stats.scoreCount += 1;
            }
            popularityByMediaId.set(mediaId, stats);
          }

          const candidateTitles = candidates.map(candidate =>
            resolveCandidateTitle(candidate as CandidateItem),
          );
          const targetInCandidates = hasTarget
            ? candidateTitles.some(title => title.toLowerCase().includes(targetTitle))
            : false;
          dbg('candidate-pool:after-sql', {
            fetchedCount: candidates.length,
            candidateIdListSize: candidateIds.length,
            targetInCandidates,
            sampleTitles: toSafeListPreview(candidateTitles, 10),
          });

          if (hasTarget) {
            const targetLookupPattern = `%${DASHBOARD_SUGGESTIONS_TARGET_TITLE}%`;
            const { data: targetRows, error: targetRowsError } = await supabase
              .from('media_items')
              .select('id,title,title_english,title_romaji,title_native,original_title,category')
              .eq('category', category)
              .or(
                `title.ilike.${targetLookupPattern},title_english.ilike.${targetLookupPattern},title_romaji.ilike.${targetLookupPattern},title_native.ilike.${targetLookupPattern},original_title.ilike.${targetLookupPattern}`,
              )
              .limit(25);

            if (targetRowsError) {
              dbg(
                `[TARGET:${DASHBOARD_SUGGESTIONS_TARGET_TITLE}] lookup-error`,
                targetRowsError.message,
              );
            } else {
              const targetLookup = (targetRows ?? []).map(row => {
                const typedRow = row as unknown as CandidateItem;
                return {
                  id: typedRow.id,
                  title: resolveCandidateTitle(typedRow),
                  excludedByExistingMediaIds: existingMediaIds.has(typedRow.id),
                  presentInFetchedCandidates: candidateIds.includes(typedRow.id),
                };
              });
              dbg(`[TARGET:${DASHBOARD_SUGGESTIONS_TARGET_TITLE}] candidate presence diagnostics`, {
                foundInMediaItemsForCategory: targetLookup.length > 0,
                targetLookupCount: targetLookup.length,
                targetLookupSample: targetLookup.slice(0, 10),
                inferredFilteredByLimit:
                  targetLookup.length > 0 &&
                  targetLookup.every(
                    item => !item.presentInFetchedCandidates && !item.excludedByExistingMediaIds,
                  ) &&
                  candidateIds.length >= 100,
                sqlNotInApplied: true,
                sqlLimitApplied: 100,
              });
            }
          }

          dbgTable(
            'Candidates data-shape sanity (first 5)',
            candidates.slice(0, 5).map(candidate => {
              const typed = candidate as CandidateItem;
              const firstTag = Array.isArray(typed.tags) ? typed.tags[0] : undefined;
              return {
                title: resolveCandidateTitle(typed),
                genresType: typeof typed.genres,
                genresIsArray: Array.isArray(typed.genres),
                genresSample:
                  Array.isArray(typed.genres) && typed.genres.length > 0
                    ? safeDebugJson(typed.genres.slice(0, 2))
                    : '',
                tagsType: typeof typed.tags,
                tagsIsArray: Array.isArray(typed.tags),
                tagsSample:
                  Array.isArray(typed.tags) && typed.tags.length > 0
                    ? safeDebugJson(typed.tags[0])
                    : '',
                tagObjectKeys:
                  firstTag && typeof firstTag === 'object' && !Array.isArray(firstTag)
                    ? Object.keys(firstTag as Record<string, unknown>)
                        .slice(0, 12)
                        .join(',')
                    : '',
              };
            }),
          );
          const candidateGameTagMap =
            category === 'games'
              ? await fetchGameInsightTagMap(supabase, candidateIds)
              : new Map<number, Partial<Record<InsightTagBucket, string[]>>>();

          // 5. Score and rank candidates
          const rankedCandidates = candidates
            .map(candidate => {
              const typedCandidate = candidate as CandidateItem;
              const resolvedTitle = resolveCandidateTitle(typedCandidate);
              const targetMatch = isTargetTitleMatch(resolvedTitle);
              const candidateBucketTags =
                category === 'games'
                  ? (candidateGameTagMap.get(typedCandidate.id) ?? {})
                  : undefined;
              const hasAnyBucketSignal =
                category === 'games' &&
                INSIGHT_TAG_BUCKETS.some(
                  bucket => (candidateBucketTags?.[bucket] ?? []).length > 0,
                );
              if (targetMatch) {
                dbg(
                  `[TARGET:${DASHBOARD_SUGGESTIONS_TARGET_TITLE}] candidate bucket gate pre-check`,
                  {
                    id: typedCandidate.id,
                    title: resolvedTitle,
                    hasAnyBucketSignal,
                    bucketSummary: INSIGHT_TAG_BUCKETS.map(bucket => ({
                      bucket,
                      count: (candidateBucketTags?.[bucket] ?? []).length,
                      sample: toSafeListPreview(candidateBucketTags?.[bucket] ?? [], 3),
                    })),
                  },
                );
              }
              const gameScoreResult =
                category === 'games'
                  ? scoreCandidateItemGames(typedCandidate, preferences, candidateBucketTags ?? {})
                  : null;
              const personalScore =
                category === 'games'
                  ? gameScoreResult
                    ? gameScoreResult.score
                    : scoreCandidateItem(typedCandidate, preferences)
                  : scoreCandidateItem(typedCandidate, preferences);
              const popularity = popularityByMediaId.get(typedCandidate.id) ?? {
                tracked: 0,
                completed: 0,
                favorites: 0,
                scoreSum: 0,
                scoreCount: 0,
              };
              const trackedScore = Math.min(1, popularity.tracked / 20);
              const completionScore =
                popularity.tracked > 0 ? popularity.completed / popularity.tracked : 0;
              const favoriteScore =
                popularity.tracked > 0 ? popularity.favorites / popularity.tracked : 0;
              const avgScore =
                popularity.scoreCount > 0 ? popularity.scoreSum / popularity.scoreCount : 0;
              const ratingScore = avgScore > 0 ? Math.min(1, avgScore / 10) : 0;
              const commonKnowledgeScore =
                trackedScore * 0.5 +
                completionScore * 0.25 +
                favoriteScore * 0.15 +
                ratingScore * 0.1;
              const combinedScore = hasPreferenceSignal
                ? personalScore * 0.45 + commonKnowledgeScore * 0.55
                : commonKnowledgeScore;
              return {
                candidate: {
                  ...typedCandidate,
                  candidateBucketTags,
                },
                score: combinedScore,
                personalScore,
                commonKnowledgeScore,
                popularity,
                gameContributors: gameScoreResult?.contributors ?? [],
              };
            })
            .sort((a, b) => b.score - a.score);

          const commonKnowledgeCandidates = rankedCandidates.filter(
            item =>
              item.commonKnowledgeScore >=
                (category === 'games' ? GAME_MIN_EXTERNAL_CONFIDENCE * 0.24 : 0.12) &&
              item.popularity.tracked >= 2,
          );
          if (hasTarget) {
            const targetRanked = rankedCandidates.find(item =>
              resolveCandidateTitle(item.candidate).toLowerCase().includes(targetTitle),
            );
            dbg(`[TARGET:${DASHBOARD_SUGGESTIONS_TARGET_TITLE}] final scoring checkpoint`, {
              foundInRankedCandidates: Boolean(targetRanked),
              finalScore: targetRanked ? Number(targetRanked.score.toFixed(4)) : null,
              commonKnowledgeScore: targetRanked
                ? Number(targetRanked.commonKnowledgeScore.toFixed(4))
                : null,
              trackedByUsers: targetRanked ? targetRanked.popularity.tracked : 0,
              topContributors: (targetRanked?.gameContributors ?? []).slice(0, 5).map(item => ({
                bucket: item.bucket,
                label: item.label,
                weightedScore: Number(item.weightedScore.toFixed(4)),
              })),
            });
          }
          const scoredCandidates =
            commonKnowledgeCandidates.length > 0
              ? commonKnowledgeCandidates
              : rankedCandidates.filter(item => item.score > 0);

          // 6. Build external suggestion objects (skip similar titles)
          for (const { candidate, score, gameContributors, popularity } of scoredCandidates) {
            if (suggestions.length >= maxSuggestions) {
              break;
            }

            const title =
              candidate.title ??
              candidate.title_english ??
              candidate.title_romaji ??
              candidate.title_native ??
              candidate.original_title ??
              'Untitled';

            // Skip if user already has a similar title
            // (e.g., "Alan Wake" if they have "Alan Wake Remastered")
            const hasSimilarTitle = existingTitles.some(existingTitle =>
              areTitlesSimilar(title, existingTitle),
            );
            if (hasTarget && title.toLowerCase().includes(targetTitle)) {
              const matchedExistingTitle = existingTitles.find(existingTitle =>
                areTitlesSimilar(title, existingTitle),
              );
              dbg(`[TARGET:${DASHBOARD_SUGGESTIONS_TARGET_TITLE}] similar-title filter`, {
                title,
                hasSimilarTitle,
                matchedExistingTitle: matchedExistingTitle ?? null,
              });
            }

            if (hasSimilarTitle) {
              continue; // Skip this candidate
            }

            const cover =
              candidate.cover_image_large ?? candidate.cover_image_medium ?? DEFAULT_COVER;

            // Generate reason based on bucket/genre matches (ONLY positive weights)
            const matchingGenres = (candidate.genres ?? []).filter(
              g => g && (preferences.favoriteGenres.get(g) ?? 0) > 0,
            );
            const matchingTags =
              category === 'games'
                ? []
                : (candidate.tags ?? []).filter(
                    t => t && (preferences.favoriteTags.get(t) ?? 0) > 0,
                  );
            const droppedGenreMatch = (candidate.genres ?? [])
              .filter(genre => genre && resilientDroppedGenres.has(normalizeGenreKey(genre)))
              .slice(0, 1);

            const reason =
              droppedGenreMatch.length > 0
                ? `Second-chance pick: you still play a lot of ${droppedGenreMatch[0]} even after some drops.`
                : category === 'games'
                  ? buildGameRecommendationReason(gameContributors)
                  : matchingGenres.length > 0 && popularity.tracked >= 3
                    ? `Popular ${matchingGenres.slice(0, 2).join(' & ')} pick (${popularity.tracked} users tracked it)`
                    : matchingGenres.length > 0
                      ? `You enjoy ${matchingGenres.slice(0, 2).join(' & ')}${
                          matchingTags.length > 0 ? ` with ${matchingTags[0]}` : ''
                        }`
                      : matchingTags.length > 0
                        ? `Matches your interest in ${matchingTags.slice(0, 2).join(' & ')}`
                        : popularity.tracked >= 5
                          ? `Common knowledge pick from the database (${popularity.tracked} users tracked it)`
                          : 'Based on your library preferences';

            if (DEBUG_GAME_SUGGESTIONS && category === 'games') {
              dbg(`[Games Suggestion Debug] ${title}`, {
                contributors: gameContributors.slice(0, 3).map(item => ({
                  bucket: item.bucket,
                  label: item.label,
                  score: Number(item.weightedScore.toFixed(3)),
                })),
              });
            }

            suggestions.push({
              mediaId: candidate.id,
              category,
              title,
              cover,
              slug: titleToSlug(title),
              reason,
              confidence: Math.max(0.35, Math.min(0.99, score)),
              genres: candidate.genres ?? [],
              tags: candidate.tags ?? [],
              bucketTags: category === 'games' ? candidate.candidateBucketTags : undefined,
            });
          }
        } else {
          dbg('candidate-pool:empty-or-error', {
            hasError: Boolean(error),
            errorMessage: error?.message ?? null,
            candidatesCount: candidates?.length ?? 0,
          });
        }
      } else {
        dbg('external-pool:skipped-no-preference-signal', { category });
      }
    }
  }

  dbg('buildMediaSuggestions:end', {
    category,
    totalSuggestions: suggestions.length,
    titlesWithScores: suggestions.map(item => ({
      title: item.title,
      confidence: Number(item.confidence.toFixed(4)),
    })),
    targetAppearsInFinalList: hasTarget
      ? suggestions.some(item => item.title.toLowerCase().includes(targetTitle))
      : null,
  });

  return suggestions;
}

export async function buildBacklogPersonalMediaSuggestions(
  supabase: DashboardSupabaseClient,
  userId: string,
  category: DashboardCategoryKey,
  limit = 4,
): Promise<MediaSuggestion[]> {
  const entries = await fetchCategoryEntries(supabase, userId, category);
  return buildMediaSuggestions(supabase, userId, category, entries, {
    maxSuggestions: limit,
    maxBacklogSuggestions: 0,
  });
}
