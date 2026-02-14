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
};

export type CategoryDashboardSection = {
  topFive: DashboardTopFiveItem[];
  spotlights: CategorySpotlightCard[];
  chart: CategoryChartPayload;
  platformInsight: PlatformInsightPayload | null;
  suggestions: PersonalSuggestionCard[];
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
  spotlights: buildEmptySpotlights(category),
  chart: {
    data: [],
    insight: `Add ${CATEGORY_LABELS[category]} entries to unlock completion trends.`,
  },
  platformInsight: null,
  suggestions: buildEmptySuggestions(category),
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

function buildEmptySuggestions(category: DashboardCategoryKey): PersonalSuggestionCard[] {
  const label = CATEGORY_LABELS[category];
  return [
    {
      id: `empty-suggest-${category}-1`,
      icon: 'sparkles',
      title: `${label} patterns pending`,
      explanation: `This panel will show habits once we see a few ${label.toLowerCase()} completions.`,
      stat: 'No data yet',
    },
    {
      id: `empty-suggest-${category}-2`,
      icon: 'chart-line',
      title: 'Need more updates',
      explanation: 'Fill out progress to help us measure momentum.',
      stat: '0 in-progress entries',
    },
    {
      id: `empty-suggest-${category}-3`,
      icon: 'clock-4',
      title: 'Signal locked',
      explanation: 'Persist with your current entries to unlock richer advice.',
      stat: 'Awaiting history',
    },
    {
      id: `empty-suggest-${category}-4`,
      icon: 'lightbulb',
      title: 'Self-tracking only',
      explanation: 'These cards are strictly derived from your library.',
      stat: 'Private data only',
    },
  ];
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

  requestedCategories.forEach((category, index) => {
    const entries = entryResults[index] ?? [];
    const chartRows = chartResults[index] ?? [];
    const topFive = buildTopFive(entries, category);
    const excludedIds = new Set(topFive.map(item => item.entryId));

    sections[category] = {
      topFive,
      spotlights: buildSpotlights(category, entries),
      chart: buildCategoryChart(category, chartRows),
      platformInsight: category === 'games' ? buildGamePlatformInsight(entries) : null,
      suggestions: buildCategorySuggestions(category, entries),
      favorites: buildFavoriteEntryCards(entries, excludedIds, category),
      mediaSuggestions: mediaSuggestionsResults[index] ?? [],
    };
  });

  return sections;
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
  if (!media) return CATEGORY_LABELS[category];
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
  if (!timestamp) return 'Recently';
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
    if (seen.has(card.id)) continue;
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
    if (entry.status === 'completed') current.completed += 1;
    if (entry.status === 'dropped') current.dropped += 1;

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
      if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate;
      if (b.total !== a.total) return b.total - a.total;
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
    if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate;
    if (b.total !== a.total) return b.total - a.total;
    return a.platform.localeCompare(b.platform);
  })[0];

  const worst = [...comparableRows].sort((a, b) => {
    if (a.completionRate !== b.completionRate) return a.completionRate - b.completionRate;
    if (b.total !== a.total) return b.total - a.total;
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
    if (!entry.updated_at) return false;
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
    if (!entry.media_items) return false;
    const totalVolumes =
      entry.media_items.volumes ??
      entry.media_items.chapters ??
      (entry.media_items.page_count ? Math.ceil(entry.media_items.page_count / 220) : undefined);
    if (!totalVolumes || !entry.progress) return false;
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
    if (!media) return false;
    const totalVolumes = media.volumes ?? media.chapters ?? 0;
    if (!entry.progress) return false;
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
    if (!entry.updated_at) return false;
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
      if (!entry.created_at) return false;
      return new Date(entry.created_at) >= subDays(new Date(), 14);
    })
    .sort((a, b) => Number(new Date(b.created_at!)) - Number(new Date(a.created_at!)))[0];

  const studioCounts: Record<string, number> = {};
  completed.forEach(entry => {
    const studios = entry.media_items?.studios ?? [];
    studios.forEach(studio => {
      if (!studio) return;
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
    if (!service) return;
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
    if (!genre) return;
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

function buildCategorySuggestions(
  category: DashboardCategoryKey,
  entries: CategoryEntryRow[],
): PersonalSuggestionCard[] {
  if (!entries.length) {
    return buildEmptySuggestions(category);
  }

  switch (category) {
    case 'games':
      return buildGameSuggestions(entries);
    case 'books':
      return buildBookSuggestions(entries);
    case 'anime':
      return buildAnimeSuggestions(entries);
    case 'manga':
      return buildMangaSuggestions(entries);
    case 'movies':
      return buildMovieSuggestions(entries);
    case 'tv':
      return buildTvSuggestions(entries);
    default:
      return buildEmptySuggestions(category);
  }
}

function buildGameSuggestions(entries: CategoryEntryRow[]): PersonalSuggestionCard[] {
  const completed = entries.filter(entry => entry.status === 'completed');
  const current = entries.filter(entry => entry.status === 'current');
  const dropped = entries.filter(entry => entry.status === 'dropped');

  const shortCompletions = completed.filter(entry => (entry.media_items?.runtime ?? 0) <= 900);
  const shortRate = completed.length
    ? Math.round((shortCompletions.length / completed.length) * 100)
    : 0;

  const pcDrops = dropped.filter(entry =>
    (entry.selected_platform ?? '').toLowerCase().includes('pc'),
  );

  const statA = `${shortCompletions.length}/${completed.length} short completions`;
  const statB = `${pcDrops.length} PC drops`;

  return [
    {
      id: 'games-short',
      icon: 'sparkles',
      title: 'Short game wins',
      explanation: `You complete ${shortRate}% of games under 15h, so shorter adventures tend to stick.`,
      stat: statA,
      supportingText: 'Shorter runtimes are where you actually finish titles.',
    },
    {
      id: 'games-pc-drop',
      icon: 'gamepad-2',
      title: 'PC open-world drops',
      explanation: `You drop ${pcDrops.length} PC sessions, so open-world workloads may need buffering.`,
      stat: statB,
      supportingText: 'Drop data shows PC entries stall earlier than other platforms.',
    },
    {
      id: 'games-in-progress',
      icon: 'clock-4',
      title: 'Current cadence',
      explanation: `You juggle ${current.length} games right now.`,
      stat: `${current.length} in-progress`,
    },
    {
      id: 'games-completions',
      icon: 'check-circle-2',
      title: 'Completion focus',
      explanation: `You have completed ${completed.length} games and dropped ${dropped.length}, so cut down on drops for a smoother run.`,
      stat: `${completed.length} completed`,
    },
  ];
}

function isWeekend(dateTime?: string | null): boolean {
  if (!dateTime) return false;
  const day = new Date(dateTime).getDay();
  return day === 0 || day === 6;
}

function buildBookSuggestions(entries: CategoryEntryRow[]): PersonalSuggestionCard[] {
  const completed = entries.filter(entry => entry.status === 'completed');
  const longReads = completed.filter(entry => (entry.media_items?.page_count ?? 0) >= 400);
  const weekendUpdates = entries.filter(entry => isWeekend(entry.updated_at));
  const seriesEntries = entries.filter(entry => {
    const volumes = entry.media_items?.volumes ?? 0;
    return volumes > 1 && entry.status === 'current';
  });

  return [
    {
      id: 'books-long-reads',
      icon: 'book-open',
      title: 'Long read wins',
      explanation: `You finish ${longReads.length} hefty books (400+ pages), showing stamina for long formats.`,
      stat: `${longReads.length} long completions`,
    },
    {
      id: 'books-weekend',
      icon: 'sun',
      title: 'Weekend momentum',
      explanation: `You update ${weekendUpdates.length} entries on weekends, meaning weekend sessions drive your reading pace.`,
      stat: `${weekendUpdates.length} weekend updates`,
    },
    {
      id: 'books-series',
      icon: 'layers',
      title: 'Series momentum',
      explanation: `You are mid-series on ${seriesEntries.length} books—keep going to keep the chain alive.`,
      stat: `${seriesEntries.length} series in-progress`,
      ctaLabel: 'Continue the series',
    },
    {
      id: 'books-completion',
      icon: 'book',
      title: 'Completion focus',
      explanation: `You completed ${completed.length} books overall, so keep balancing new starts with finishes.`,
      stat: `${completed.length} completions total`,
    },
  ];
}

function buildAnimeSuggestions(entries: CategoryEntryRow[]): PersonalSuggestionCard[] {
  const completed = entries.filter(entry => entry.status === 'completed');
  const twelveEpisodeCompletes = completed.filter(entry => {
    const episodes = entry.media_items?.number_of_episodes ?? entry.media_items?.episodes ?? 0;
    return episodes > 0 && episodes <= 12;
  });
  const weekendUpdates = entries.filter(entry => isWeekend(entry.updated_at));
  const current = entries.filter(entry => entry.status === 'current');
  const dropInsight = buildDropPattern(entries);

  return [
    {
      id: 'anime-twelve',
      icon: 'film',
      title: '12-episode completions',
      explanation: `You completed ${twelveEpisodeCompletes.length} short series (≤12 eps), so short-season anime are a strength.`,
      stat: `${twelveEpisodeCompletes.length} short completions`,
    },
    {
      id: 'anime-drop-signal',
      icon: 'alert',
      title: 'Drop pattern',
      explanation: dropInsight.explanation,
      stat: dropInsight.subtitle,
    },
    {
      id: 'anime-weekend',
      icon: 'sparkles',
      title: 'Weekend watchlist',
      explanation: `You update ${weekendUpdates.length} shows on weekends, which keeps your cadence steady.`,
      stat: `${weekendUpdates.length} weekend updates`,
    },
    {
      id: 'anime-current',
      icon: 'clock-4',
      title: 'In-progress focus',
      explanation: `You have ${current.length} anime currently running. Prioritize one to avoid fatigue.`,
      stat: `${current.length} in-progress`,
    },
  ];
}

function buildMangaSuggestions(entries: CategoryEntryRow[]): PersonalSuggestionCard[] {
  const completed = entries.filter(entry => entry.status === 'completed');
  const shortVolumes = completed.filter(entry => {
    const volumes = entry.media_items?.volumes ?? 0;
    return volumes && volumes <= 6;
  });
  const hiatus = entries.filter(entry => {
    if (entry.status !== 'current' || !entry.updated_at) return false;
    return new Date(entry.updated_at) < subDays(new Date(), 21);
  });
  const current = entries.filter(entry => entry.status === 'current');

  const totalEntries =
    completed.length + current.length + entries.filter(entry => entry.status === 'dropped').length;
  const completionRate = totalEntries ? Math.round((completed.length / totalEntries) * 100) : 0;

  return [
    {
      id: 'manga-short',
      icon: 'volume',
      title: 'Short volume strength',
      explanation: `You complete ${shortVolumes.length} entries with 6 volumes or fewer—short runs are reliable.`,
      stat: `${shortVolumes.length} compact completions`,
    },
    {
      id: 'manga-hiatus',
      icon: 'clock-4',
      title: 'Hiatus reads',
      explanation: `You have ${hiatus.length} entries idle for 3+ weeks; revive them to maintain flow.`,
      stat: `${hiatus.length} long pauses`,
    },
    {
      id: 'manga-current',
      icon: 'layers',
      title: 'Current lineup',
      explanation: `You juggle ${current.length} manga right now. Finishing one reduces clutter.`,
      stat: `${current.length} in-progress`,
    },
    {
      id: 'manga-rate',
      icon: 'check-circle-2',
      title: 'Completion rate',
      explanation: `You complete ${completionRate}% of manga you start, so the ratio is leaning positive.`,
      stat: `${completionRate}% completion`,
    },
  ];
}

function buildMovieSuggestions(entries: CategoryEntryRow[]): PersonalSuggestionCard[] {
  const completed = entries.filter(entry => entry.status === 'completed');
  const planned = entries.filter(entry => entry.status === 'planned');
  const shortFilms = completed.filter(entry => (entry.media_items?.runtime ?? 0) <= 90);
  const rewatchCount = entries.filter(entry =>
    entry.notes?.toLowerCase().includes('rewatch'),
  ).length;

  const studioCounts: Record<string, number> = {};
  completed.forEach(entry => {
    const studios = entry.media_items?.studios ?? [];
    studios.forEach(studio => {
      if (!studio) return;
      studioCounts[studio] = (studioCounts[studio] ?? 0) + 1;
    });
  });
  const topStudio = Object.entries(studioCounts).sort(([, a], [, b]) => b - a)[0];

  return [
    {
      id: 'movies-short',
      icon: 'film',
      title: 'Short film streak',
      explanation: `You complete ${shortFilms.length} movies under 90 minutes, so short features stay finished.`,
      stat: `${shortFilms.length} short completions`,
    },
    {
      id: 'movies-studio',
      icon: 'star',
      title: 'Studio focus',
      explanation: topStudio
        ? `You complete ${topStudio[1]} titles from ${topStudio[0]}, indicating a studio you revisit.`
        : 'Studio pattern will appear once you finish more titles.',
      stat: topStudio ? `${topStudio[0]} ${topStudio[1]}x` : 'Awaiting completions',
    },
    {
      id: 'movies-rewatch',
      icon: 'refresh-cw',
      title: 'Rewatch trend',
      explanation: rewatchCount
        ? `You noted ${rewatchCount} rewatches, so you revisit favorites regularly.`
        : 'No rewatch notes yet—log them to track repeats.',
      stat: `${rewatchCount} rewatch notes`,
    },
    {
      id: 'movies-planned',
      icon: 'clock-4',
      title: 'Planned backlog',
      explanation: `You have ${planned.length} planned movies waiting, so prioritize one for a quick win.`,
      stat: `${planned.length} planned`,
    },
  ];
}

function buildTvSuggestions(entries: CategoryEntryRow[]): PersonalSuggestionCard[] {
  const completed = entries.filter(entry => entry.status === 'completed');
  const current = entries.filter(entry => entry.status === 'current');
  const dropped = entries.filter(entry => entry.status === 'dropped');

  const shortSeasons = completed.filter(entry => {
    const media = entry.media_items;
    const totalEpisodes = media?.number_of_episodes ?? media?.episodes;
    return totalEpisodes !== null && totalEpisodes !== undefined && totalEpisodes <= 10;
  });

  const nextEpisodeReady = current.filter(entry => {
    const media = entry.media_items;
    const totalEpisodes = media?.number_of_episodes ?? media?.episodes;
    return (
      totalEpisodes !== null && totalEpisodes !== undefined && (entry.progress ?? 0) < totalEpisodes
    );
  });

  const serviceCounts: Record<string, number> = {};
  completed.forEach(entry => {
    const service = entry.selected_platform?.trim() ?? entry.media_items?.platforms?.find(Boolean);
    if (!service) return;
    serviceCounts[service] = (serviceCounts[service] ?? 0) + 1;
  });

  const topService = Object.entries(serviceCounts).sort(([, a], [, b]) => b - a)[0];

  const totalTracked = completed.length + current.length + dropped.length;
  const completionRate = totalTracked ? Math.round((completed.length / totalTracked) * 100) : 0;

  return [
    {
      id: 'tv-short',
      icon: 'film',
      title: 'Short season wins',
      explanation: `You finish ${shortSeasons.length} seasons with 10 episodes or fewer, so short broadcasts stick.`,
      stat: `${shortSeasons.length} short completions`,
      supportingText: 'Short runs are where you build momentum.',
    },
    {
      id: 'tv-next-queue',
      icon: 'clock-4',
      title: 'Next episode queue',
      explanation: `You have ${nextEpisodeReady.length} shows that still have episodes to catch up on.`,
      stat: `${nextEpisodeReady.length} next episodes`,
    },
    {
      id: 'tv-service',
      icon: 'star',
      title: 'Service focus',
      explanation: topService
        ? `You complete ${topService[1]} shows on ${topService[0]}, highlighting that platform as your go-to.`
        : 'Complete a few shows to reveal your go-to service.',
      stat: topService
        ? `${topService[0]} · ${topService[1]} completions`
        : 'Awaiting service data',
    },
    {
      id: 'tv-rate',
      icon: 'check-circle-2',
      title: 'Completion rate',
      explanation: `You finish ${completionRate}% of the TV entries you track, so keep balancing starts with finishes.`,
      stat: `${completionRate}% completion`,
      supportingText: `${completed.length} completed · ${dropped.length} dropped`,
    },
  ];
}

function entryHasEpisodes(entry: CategoryEntryRow, category: DashboardCategoryKey): boolean {
  const media = entry.media_items;
  if (!media) return false;
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
    if (!genres.length) continue;
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
  if (normalized1 === normalized2) return true;

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
      if (!media) continue;

      const entryTitle =
        media.title ??
        media.title_english ??
        media.title_romaji ??
        media.title_native ??
        media.original_title ??
        '';

      if (!entryTitle) continue;

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
    if (!entryMedia) continue;

    // ONLY count games you've actually played (completed or current)
    // Skip planned (0 hours) and dropped games
    if (entry.status === 'planned') continue; // Skip backlog items - not played yet!
    if (entry.status === 'dropped') continue; // Skip dropped games

    // Weight completed and favorite games more heavily
    let weight = 1;
    if (entry.status === 'completed') weight = 3;
    if (entry.is_favorite) weight = 4;

    // Factor in hours played (progress) - more hours = more engagement
    const hours = Math.max(0, entry.progress ?? 0);
    // Hours multiplier: 10h=1.5x, 20h=2x, 50h=3.5x, 100h=6x, 200h=11x
    // This heavily boosts genres from games you spent a lot of time in
    const hoursMultiplier = 1 + hours / 20;
    weight *= hoursMultiplier;

    // Count genres
    for (const genre of entryMedia.genres ?? []) {
      if (!genre) continue;
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + weight);
    }

    // Count tags (limit to avoid noise)
    const entryTags = (entryMedia.tags ?? []).slice(0, 5);
    for (const tag of entryTags) {
      if (!tag) continue;
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
  droppedGenreCombinations: Set<string>; // stringified genre arrays from dropped games
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
};

/**
 * Analyzes user's entries to extract preferences
 */
function analyzeUserPreferences(entries: CategoryEntryRow[]): UserPreferences {
  const genreWeights = new Map<string, number>();
  const tagWeights = new Map<string, number>();
  const droppedGenreCombinations = new Set<string>();
  let totalRating = 0;
  let ratingCount = 0;
  const completedCount = entries.filter(e => e.status === 'completed').length;

  for (const entry of entries) {
    const media = entry.media_items;
    if (!media) continue;

    const genres = media.genres ?? [];
    const isDropped = entry.status === 'dropped';

    // Track dropped genre combinations
    if (isDropped && genres.length > 0) {
      const genreKey = genres.filter(Boolean).sort().join('|');
      droppedGenreCombinations.add(genreKey);
    }

    // Weight based on status and rating
    let weight = 1;
    if (entry.status === 'completed') weight = 3;
    else if (entry.status === 'current') weight = 2;
    else if (entry.is_favorite) weight = 4;
    else if (isDropped) weight = -2; // NEGATIVE weight for dropped

    // Higher rating = more weight
    if (entry.score !== null && entry.score !== undefined && !isDropped) {
      weight *= entry.score / 5; // Normalize to 0-2 range
      totalRating += entry.score;
      ratingCount++;
    }

    // Count genres (can be negative for dropped)
    for (const genre of genres) {
      if (!genre) continue;
      genreWeights.set(genre, (genreWeights.get(genre) ?? 0) + weight);
    }

    // Count tags (only if not empty array)
    const tags = media.tags ?? [];
    if (Array.isArray(tags) && tags.length > 0) {
      for (const tag of tags) {
        if (!tag) continue;
        tagWeights.set(tag, (tagWeights.get(tag) ?? 0) + weight);
      }
    }
  }

  return {
    favoriteGenres: genreWeights,
    favoriteTags: tagWeights,
    droppedGenreCombinations,
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
      if (weight > 0) tagScore += weight;
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
  if (maxScore <= 0) return 0;
  return Math.max(0, Math.min(1, score / maxScore));
}

/**
 * Builds media suggestions for a category
 * Strategy: First 2 from user's backlog, last 2 from external recommendations
 */
async function buildMediaSuggestions(
  supabase: DashboardSupabaseClient,
  userId: string,
  category: DashboardCategoryKey,
  userEntries: CategoryEntryRow[],
): Promise<MediaSuggestion[]> {
  // Need at least 3 entries to generate meaningful suggestions
  if (userEntries.length < 3) {
    return [];
  }

  const suggestions: MediaSuggestion[] = [];

  // ============================================================================
  // PART 1: Backlog suggestions (first 2)
  // ============================================================================
  const backlogEntries = userEntries.filter(entry => entry.status === 'planned');

  if (backlogEntries.length > 0) {
    // Sort by priority (if exists) or updated_at
    const sortedBacklog = backlogEntries.sort((a, b) => {
      const priorityA = (a as unknown as { priority?: number }).priority ?? 0;
      const priorityB = (b as unknown as { priority?: number }).priority ?? 0;
      if (priorityA !== priorityB) return priorityB - priorityA;
      const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return dateB - dateA;
    });

    // Take up to 2 from backlog, but filter out sequels without prerequisites
    for (const entry of sortedBacklog) {
      if (suggestions.length >= 2) break; // Already have 2 backlog suggestions

      const media = entry.media_items;
      if (!media) continue;

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

      // Skip if it's a sequel without prerequisites played
      if (!prerequisiteCheck.canRecommend) {
        console.log(`⚠️ Skipping "${title}" - previous game in series not played/completed`);
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

  // ============================================================================
  // PART 2: External suggestions (up to 2 more)
  // ============================================================================
  const neededExternal = 4 - suggestions.length; // Fill up to 4 total

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
          if (!media) return null;
          return (
            media.title ??
            media.title_english ??
            media.title_romaji ??
            media.title_native ??
            media.original_title
          );
        })
        .filter((title): title is string => title !== null && title !== undefined);

      // 3. Analyze user preferences
      const preferences = analyzeUserPreferences(userEntries);

      if (preferences.favoriteGenres.size > 0 || preferences.favoriteTags.size > 0) {
        // 4. Fetch candidate items from database (exclude user's items)
        const { data: candidates, error } = await supabase
          .from('media_items')
          .select(
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
          )
          .eq('category', category)
          .not('id', 'in', `(${Array.from(existingMediaIds).join(',')})`)
          .limit(100);

        if (!error && candidates && candidates.length > 0) {
          // 5. Score and rank candidates with 50% minimum confidence
          const scoredCandidates = candidates
            .map(candidate => ({
              candidate: candidate as CandidateItem,
              score: scoreCandidateItem(candidate as CandidateItem, preferences),
            }))
            .filter(item => item.score >= 0.5) // Minimum 50% confidence
            .sort((a, b) => b.score - a.score);

          // 6. Build external suggestion objects (skip similar titles)
          for (const { candidate, score } of scoredCandidates) {
            if (suggestions.length >= 4) break; // Already have 4 suggestions

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

            if (hasSimilarTitle) {
              continue; // Skip this candidate
            }

            const cover =
              candidate.cover_image_large ?? candidate.cover_image_medium ?? DEFAULT_COVER;

            // Generate reason based on matching genres/tags (ONLY positive weights)
            const matchingGenres = (candidate.genres ?? []).filter(
              g => g && (preferences.favoriteGenres.get(g) ?? 0) > 0,
            );
            const matchingTags = (candidate.tags ?? []).filter(
              t => t && (preferences.favoriteTags.get(t) ?? 0) > 0,
            );

            let reason = '';
            if (matchingGenres.length > 0) {
              reason = `You enjoy ${matchingGenres.slice(0, 2).join(' & ')}`;
              if (matchingTags.length > 0) {
                reason += ` with ${matchingTags[0]}`;
              }
            } else if (matchingTags.length > 0) {
              reason = `Matches your interest in ${matchingTags.slice(0, 2).join(' & ')}`;
            } else {
              reason = 'Based on your library preferences';
            }

            suggestions.push({
              mediaId: candidate.id,
              category,
              title,
              cover,
              slug: titleToSlug(title),
              reason,
              confidence: score,
              genres: candidate.genres ?? [],
              tags: candidate.tags ?? [],
            });
          }
        }
      }
    }
  }

  return suggestions;
}
