/**
 * Server-side data fetching for dashboard
 * Extracted from API routes for direct Server Component usage
 */

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

// Types from /api/user/stats
type CategoryStats = {
  total: number;
  in_progress: number;
  completed: number;
  dropped: number;
  hours: number;
};

export type PersonalStats = {
  // Summary totals
  total_backlog: number;
  in_progress: number;
  completed: number;
  total_hours: number;
  // Per-category breakdown
  games: CategoryStats;
  anime: CategoryStats;
  manga: CategoryStats & { chapters: number };
  movies: CategoryStats;
  tv: CategoryStats;
  books: CategoryStats & { pages: number };
  // Which categories user has content in
  active_categories: string[];
};

type StatsEntry = {
  status: string;
  progress: number | null;
  media_items: {
    category: string | null;
    runtime: number | null;
    duration: number | null;
    episodes: number | null;
    number_of_episodes: number | null;
    page_count: number | null;
    chapters: number | null;
    volumes: number | null;
  } | null;
};

// Types from /api/user/continue
const DASHBOARD_CATEGORIES = ['games', 'anime', 'manga', 'movies', 'tv', 'books'] as const;
const SLIDE_CATEGORIES = ['games', 'anime', 'manga', 'tv', 'books'] as const;
type DashboardCategory = (typeof DASHBOARD_CATEGORIES)[number];

export type ContinueSlide = {
  category: string;
  entry_id: number;
  media_id: number;
  status: string;
  progress: number | null;
  score: string | null;
  updated_at: string;
  created_at: string;
  title: string | null;
  season_year: number | null;
  release_date: string | null;
  cover_image_large: string | null;
  cover_image_medium: string | null;
};

type CountBucket = {
  total: number;
  planned: number;
  current: number;
  completed: number;
  dropped: number;
};

export type ContinueData = {
  enabledCategories: string[];
  slides: ContinueSlide[];
  countsByCategory: Record<string, CountBucket>;
};

type MediaPreview = {
  category: string | null;
  source: string | null;
  steam_app_id: number | null;
  title: string | null;
  title_english: string | null;
  title_romaji: string | null;
  title_native: string | null;
  original_title: string | null;
  season_year: number | null;
  release_date: string | null;
  cover_image_large: string | null;
  cover_image_medium: string | null;
};

type ContinueEntry = {
  id: number;
  media_id: number;
  status: string;
  progress: number | null;
  score: number | null;
  updated_at: string | null;
  created_at: string | null;
  media_items: MediaPreview | null;
};

type CountEntry = {
  status: string | null;
  media_items: { category: string | null } | null;
};

// Constants
const ANIME_EPISODE_MINUTES = 24;
const TV_EPISODE_MINUTES = 45;

// Helper functions
const toTimestamp = (value: string | null | undefined) => {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getEntryActivityTimestamp = (entry: Pick<ContinueEntry, 'updated_at' | 'created_at'>) =>
  toTimestamp(entry.updated_at ?? entry.created_at);

const compareEntryDates = (a: ContinueEntry, b: ContinueEntry) => {
  return getEntryActivityTimestamp(b) - getEntryActivityTimestamp(a);
};

const resolveTitle = (media: MediaPreview | null) =>
  media?.title ??
  media?.title_english ??
  media?.title_romaji ??
  media?.title_native ??
  media?.original_title ??
  null;

const normalizeSteamCoverForContinue = (
  url: string | null | undefined,
  steamAppId: number | null | undefined,
) => {
  if (!url) {
    return null;
  }

  if (
    steamAppId &&
    url === `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamAppId}/header.jpg`
  ) {
    return null;
  }

  if (
    url.includes('cdn.cloudflare.steamstatic.com/steam/apps/') &&
    !url.includes('/steamcommunity/public/images/apps/') &&
    !url.endsWith('/header.jpg')
  ) {
    return url.replace('/steam/apps/', '/steamcommunity/public/images/apps/');
  }

  return url;
};

const normalizeEnabledCategories = (categories: string[]) =>
  categories.filter(category => DASHBOARD_CATEGORIES.includes(category as DashboardCategory));

/**
 * Fetch user stats server-side
 * @param userId - The authenticated user ID
 * @returns PersonalStats object
 */
export async function fetchUserStats(userId: string): Promise<PersonalStats> {
  const supabase = await createRouteHandlerClient();

  const { data: entries, error } = await supabase
    .from('user_media_entries')
    .select(
      `
      status,
      progress,
      media_items!inner (
        category,
        runtime,
        duration,
        episodes,
        number_of_episodes,
        page_count,
        chapters,
        volumes
      )
    `,
    )
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  const statsEntries = Array.isArray(entries) ? (entries as StatsEntry[]) : [];

  const gameStats: CategoryStats = { total: 0, in_progress: 0, completed: 0, dropped: 0, hours: 0 };
  const animeStats: CategoryStats = {
    total: 0,
    in_progress: 0,
    completed: 0,
    dropped: 0,
    hours: 0,
  };
  const mangaStats: CategoryStats & { chapters: number } = {
    total: 0,
    in_progress: 0,
    completed: 0,
    dropped: 0,
    hours: 0,
    chapters: 0,
  };
  const movieStats: CategoryStats = {
    total: 0,
    in_progress: 0,
    completed: 0,
    dropped: 0,
    hours: 0,
  };
  const tvStats: CategoryStats = { total: 0, in_progress: 0, completed: 0, dropped: 0, hours: 0 };
  const bookStats: CategoryStats & { pages: number } = {
    total: 0,
    in_progress: 0,
    completed: 0,
    dropped: 0,
    hours: 0,
    pages: 0,
  };

  for (const entry of statsEntries) {
    const media = entry.media_items;
    if (!media || !media.category) {
      continue;
    }

    const normalizedCategory = media.category;
    const status = entry.status;
    const isCompleted = status === 'completed';
    const isInProgress =
      normalizedCategory === 'movies' ? status === 'planned' : status === 'current';
    const isDropped = status === 'dropped';

    switch (normalizedCategory) {
      case 'games': {
        gameStats.total++;
        if (isInProgress) {
          gameStats.in_progress++;
        }
        if (isCompleted) {
          gameStats.completed++;
        }
        if (isDropped) {
          gameStats.dropped++;
        }
        gameStats.hours += entry.progress ?? 0;
        break;
      }
      case 'anime': {
        animeStats.total++;
        if (isInProgress) {
          animeStats.in_progress++;
        }
        if (isCompleted) {
          animeStats.completed++;
        }
        if (isDropped) {
          animeStats.dropped++;
        }
        const duration = media.duration ?? ANIME_EPISODE_MINUTES;
        const totalEpisodes = media.number_of_episodes ?? media.episodes ?? 0;
        if (isCompleted) {
          animeStats.hours += (totalEpisodes * duration) / 60;
        } else if (isInProgress && entry.progress) {
          animeStats.hours += (entry.progress * duration) / 60;
        }
        break;
      }
      case 'manga': {
        mangaStats.total++;
        if (isInProgress) {
          mangaStats.in_progress++;
        }
        if (isCompleted) {
          mangaStats.completed++;
        }
        if (isDropped) {
          mangaStats.dropped++;
        }

        const volumesRead = isCompleted ? (media.volumes ?? 0) : (entry.progress ?? 0);
        mangaStats.chapters += volumesRead;

        const AVG_PAGES_PER_VOLUME = 220;
        const MANGA_PAGES_PER_HOUR = 55;
        const basePages = volumesRead * AVG_PAGES_PER_VOLUME;
        mangaStats.hours += basePages > 0 ? basePages / MANGA_PAGES_PER_HOUR : 0;
        break;
      }
      case 'movies': {
        movieStats.total++;
        if (isInProgress) {
          movieStats.in_progress++;
        }
        if (isCompleted) {
          movieStats.completed++;
          movieStats.hours += (media.runtime ?? 120) / 60;
        }
        if (isDropped) {
          movieStats.dropped++;
        }
        break;
      }
      case 'tv': {
        tvStats.total++;
        if (isInProgress) {
          tvStats.in_progress++;
        }
        if (isCompleted) {
          tvStats.completed++;
        }
        if (isDropped) {
          tvStats.dropped++;
        }
        const totalEpisodes = media.number_of_episodes ?? media.episodes ?? 0;
        const episodeDuration = media.runtime ?? TV_EPISODE_MINUTES;
        if (isCompleted) {
          tvStats.hours += (totalEpisodes * episodeDuration) / 60;
        } else if (isInProgress && entry.progress) {
          tvStats.hours += (entry.progress * episodeDuration) / 60;
        }
        break;
      }
      case 'books': {
        bookStats.total++;
        if (isInProgress) {
          bookStats.in_progress++;
        }
        if (isCompleted) {
          bookStats.completed++;
        }
        if (isDropped) {
          bookStats.dropped++;
        }

        const pagesRead = isCompleted ? (media.page_count ?? 0) : (entry.progress ?? 0);
        bookStats.pages += pagesRead;

        const BOOK_PAGES_PER_HOUR = 35;
        bookStats.hours += pagesRead > 0 ? pagesRead / BOOK_PAGES_PER_HOUR : 0;
        break;
      }
      default:
        break;
    }
  }

  const activeCategories: string[] = [];
  if (gameStats.total > 0) {
    activeCategories.push('games');
  }
  if (animeStats.total > 0) {
    activeCategories.push('anime');
  }
  if (mangaStats.total > 0) {
    activeCategories.push('manga');
  }
  if (movieStats.total > 0) {
    activeCategories.push('movies');
  }
  if (tvStats.total > 0) {
    activeCategories.push('tv');
  }
  if (bookStats.total > 0) {
    activeCategories.push('books');
  }

  const totalBacklog =
    gameStats.total +
    animeStats.total +
    mangaStats.total +
    movieStats.total +
    tvStats.total +
    bookStats.total;
  const totalInProgress =
    gameStats.in_progress +
    animeStats.in_progress +
    mangaStats.in_progress +
    movieStats.in_progress +
    tvStats.in_progress +
    bookStats.in_progress;
  const totalCompleted =
    gameStats.completed +
    animeStats.completed +
    mangaStats.completed +
    movieStats.completed +
    tvStats.completed +
    bookStats.completed;
  const totalHours =
    gameStats.hours +
    animeStats.hours +
    mangaStats.hours +
    movieStats.hours +
    tvStats.hours +
    bookStats.hours;

  const stats: PersonalStats = {
    total_backlog: totalBacklog,
    in_progress: totalInProgress,
    completed: totalCompleted,
    total_hours: Math.round(totalHours),
    games: {
      ...gameStats,
      hours: Math.round(gameStats.hours),
    },
    anime: {
      ...animeStats,
      hours: Math.round(animeStats.hours),
    },
    manga: {
      ...mangaStats,
      hours: Math.round(mangaStats.hours),
      chapters: mangaStats.chapters,
    },
    movies: {
      ...movieStats,
      hours: Math.round(movieStats.hours),
    },
    tv: {
      ...tvStats,
      hours: Math.round(tvStats.hours),
    },
    books: {
      ...bookStats,
      hours: Math.round(bookStats.hours),
      pages: bookStats.pages,
    },
    active_categories: activeCategories,
  };

  return stats;
}

/**
 * Fetch continue data server-side
 * @param userId - The authenticated user ID
 * @returns ContinueData object
 */
export async function fetchContinueData(userId: string): Promise<ContinueData> {
  const supabase = await createRouteHandlerClient();

  // Calculate enabled categories from user_category_profiles
  const { data: categoryProfile } = await supabase
    .from('user_category_profiles')
    .select('profiles')
    .eq('user_id', userId)
    .maybeSingle();

  // Categories are the keys in user_category_profiles.profiles
  const enabledCategories = categoryProfile?.profiles
    ? Object.keys(categoryProfile.profiles).filter(key => key && typeof key === 'string')
    : [];

  const normalizedCategories = normalizeEnabledCategories(enabledCategories);
  const slideCategories = normalizedCategories.filter(category =>
    SLIDE_CATEGORIES.includes(category as (typeof SLIDE_CATEGORIES)[number]),
  );

  if (normalizedCategories.length === 0) {
    return {
      enabledCategories: normalizedCategories,
      slides: [],
      countsByCategory: {},
    };
  }

  let entries: ContinueEntry[] = [];
  if (slideCategories.length > 0) {
    const { data: currentEntries, error: currentError } = await supabase
      .from('user_media_entries')
      .select(
        `
        id,
        media_id,
        status,
        progress,
        score,
        updated_at,
        created_at,
        media_items!inner (
          category,
          source,
          steam_app_id,
          title,
          title_english,
          title_romaji,
          title_native,
          original_title,
          season_year,
          release_date,
          cover_image_large,
          cover_image_medium
        )
      `,
      )
      .eq('user_id', userId)
      .eq('status', 'current')
      .in('media_items.category', slideCategories)
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (currentError) {
      throw currentError;
    }

    entries = Array.isArray(currentEntries) ? (currentEntries as ContinueEntry[]) : [];
  }

  const sortedEntries = entries
    .filter(entry => entry.media_items?.category)
    .sort(compareEntryDates);

  const latestByCategory = new Map<string, ContinueSlide>();
  for (const entry of sortedEntries) {
    const media = entry.media_items;
    const category = media?.category;
    if (!category || latestByCategory.has(category)) {
      continue;
    }

    latestByCategory.set(category, {
      category,
      entry_id: entry.id,
      media_id: entry.media_id,
      status: entry.status,
      progress: entry.progress ?? null,
      score: entry.score !== null && entry.score !== undefined ? String(entry.score) : null,
      updated_at: entry.updated_at ?? entry.created_at ?? '',
      created_at: entry.created_at ?? entry.updated_at ?? '',
      title: resolveTitle(media),
      season_year: media?.season_year ?? null,
      release_date: media?.release_date ?? null,
      cover_image_large:
        media?.source === 'steam'
          ? normalizeSteamCoverForContinue(media?.cover_image_large, media?.steam_app_id)
          : (media?.cover_image_large ?? null),
      cover_image_medium:
        media?.source === 'steam'
          ? normalizeSteamCoverForContinue(media?.cover_image_medium, media?.steam_app_id)
          : (media?.cover_image_medium ?? null),
    });
  }

  const slides = Array.from(latestByCategory.values()).sort(
    (a, b) => toTimestamp(b.updated_at || b.created_at) - toTimestamp(a.updated_at || a.created_at),
  );

  const { data: countEntries, error: countError } = await supabase
    .from('user_media_entries')
    .select('status, media_items!inner(category)')
    .eq('user_id', userId)
    .in('media_items.category', normalizedCategories);

  if (countError) {
    throw countError;
  }

  const countsByCategory: Record<string, CountBucket> = {};
  for (const category of normalizedCategories) {
    countsByCategory[category] = {
      total: 0,
      planned: 0,
      current: 0,
      completed: 0,
      dropped: 0,
    };
  }

  for (const entry of (countEntries ?? []) as CountEntry[]) {
    const category = entry.media_items?.category;
    if (!category || !(category in countsByCategory)) {
      continue;
    }

    if (!entry.status) {
      continue;
    }
    const status = entry.status;
    countsByCategory[category].total += 1;

    if (status in countsByCategory[category]) {
      countsByCategory[category][status as keyof CountBucket] += 1;
    }
  }

  return {
    enabledCategories: normalizedCategories,
    slides,
    countsByCategory,
  };
}
