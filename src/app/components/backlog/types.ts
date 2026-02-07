import { Film, BookOpen, Sparkles, Tv, Gamepad2 } from 'lucide-react';

export type MediaCategory = 'anime' | 'manga' | 'books' | 'movies' | 'tv' | 'games';

export type MediaStatus = 'planned' | 'current' | 'completed' | 'dropped';

export type MediaEntry = {
  id: string;
  title: string;
  subtitle: string;
  year?: string;
  status: MediaStatus;
  isFavorite?: boolean;
  score?: string;
  tags: string[];
  cover: string;
  importSource?: string;
  catalogSource?: string;
  progress?: number;
  notes?: string;
  selectedPlatform?: string;
  format?: string;
  description?: string;
  totalEpisodes?: number;
  totalChapters?: number;
  totalVolumes?: number;
  totalRuntime?: number;
  totalPages?: number;
  mediaId?: number;
  entryId?: number;
  rawgId?: number;
  // Game-specific fields
  platforms?: string[];
  developer?: string;
  publisher?: string;
  metacritic?: number;
  runtime?: number; // Hours for games
};

export type SearchResult = MediaEntry & {
  source: 'local' | 'external' | 'mock';
  mediaId?: number;
  externalId?: number;
  payload?: Record<string, unknown>;
};

export type CategoryConfig = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  currentLabel: string;
  plannedLabel: string;
  completedLabel: string;
  droppedLabel: string;
  icon: typeof Film;
};

export const isMediaCategory = (value: string | null): value is MediaCategory => {
  return (
    value === 'anime' ||
    value === 'manga' ||
    value === 'books' ||
    value === 'movies' ||
    value === 'tv' ||
    value === 'games'
  );
};

export const CATEGORY_CONFIG: Record<MediaCategory, CategoryConfig> = {
  anime: {
    title: 'Anime Library',
    subtitle: 'Season tracking, favorites, and a clean MAL-inspired grid.',
    searchPlaceholder: 'Αναζήτηση anime...',
    currentLabel: 'Watching',
    plannedLabel: 'Plan to Watch',
    completedLabel: 'Completed',
    droppedLabel: 'Dropped',
    icon: Sparkles,
  },
  manga: {
    title: 'Manga Library',
    subtitle: 'Chapters, volumes, and a clean bookshelf layout.',
    searchPlaceholder: 'Αναζήτηση manga...',
    currentLabel: 'Reading',
    plannedLabel: 'Plan to Read',
    completedLabel: 'Completed',
    droppedLabel: 'Dropped',
    icon: BookOpen,
  },
  books: {
    title: 'Book Library',
    subtitle: 'Reading log, notes, and progress in a minimal shelf.',
    searchPlaceholder: 'Αναζήτηση βιβλίων...',
    currentLabel: 'Reading',
    plannedLabel: 'To Read',
    completedLabel: 'Finished',
    droppedLabel: 'Dropped',
    icon: BookOpen,
  },
  movies: {
    title: 'Movie Library',
    subtitle: 'Watchlist, ratings, and cinematic highlights.',
    searchPlaceholder: 'Αναζήτηση ταινιών...',
    currentLabel: 'Watching',
    plannedLabel: 'Watchlist',
    completedLabel: 'Watched',
    droppedLabel: 'Dropped',
    icon: Film,
  },
  tv: {
    title: 'TV Library',
    subtitle: 'Series tracking, ratings, and season progress.',
    searchPlaceholder: 'Αναζήτηση σειρών...',
    currentLabel: 'Watching now',
    plannedLabel: 'Watchlist',
    completedLabel: 'Watched',
    droppedLabel: 'Dropped',
    icon: Tv,
  },
  games: {
    title: 'Games Library',
    subtitle: 'Track your gaming backlog and platinum progress.',
    searchPlaceholder: 'Αναζήτηση παιχνιδιών...',
    currentLabel: 'Playing',
    plannedLabel: 'Backlog',
    completedLabel: 'Completed',
    droppedLabel: 'Dropped',
    icon: Gamepad2,
  },
};

export const getApiBase = (category: MediaCategory): string | null => {
  if (category === 'anime' || category === 'manga') return '/api/anime';
  if (category === 'movies' || category === 'tv') return '/api/movies';
  if (category === 'books') return '/api/books';
  if (category === 'games') return '/api/games';
  return null;
};

export const getProgressLabel = (category: MediaCategory): string => {
  if (category === 'manga') return 'Τόμος';
  if (category === 'movies') return 'Λεπτά';
  if (category === 'books') return 'Σελίδες';
  if (category === 'games') return 'Ώρες';
  return 'Επεισόδια';
};

export const supportsExternalApi = (category: MediaCategory): boolean => {
  return (
    category === 'anime' ||
    category === 'manga' ||
    category === 'movies' ||
    category === 'tv' ||
    category === 'books' ||
    category === 'games'
  );
};

export const getTotalCount = (
  entry: MediaEntry & Partial<SearchResult>,
  category: MediaCategory,
): number | undefined => {
  const normalizeCount = (value?: number | null) =>
    typeof value === 'number' && value > 0 ? value : undefined;

  const payload = entry.payload as
    | {
        episodes?: number | null;
        chapters?: number | null;
        volumes?: number | null;
        runtime?: number | null;
        number_of_episodes?: number | null;
        page_count?: number | null;
      }
    | undefined;

  if (category === 'anime') {
    return normalizeCount(entry.totalEpisodes) ?? normalizeCount(payload?.episodes) ?? undefined;
  }
  if (category === 'manga') {
    return (
      normalizeCount(entry.totalVolumes) ??
      normalizeCount(entry.totalChapters) ??
      normalizeCount(payload?.volumes) ??
      normalizeCount(payload?.chapters) ??
      undefined
    );
  }
  if (category === 'movies') {
    return normalizeCount(entry.totalRuntime) ?? normalizeCount(payload?.runtime) ?? undefined;
  }
  if (category === 'tv') {
    return (
      normalizeCount(entry.totalEpisodes) ??
      normalizeCount(payload?.number_of_episodes) ??
      undefined
    );
  }
  if (category === 'books') {
    return normalizeCount(entry.totalPages) ?? normalizeCount(payload?.page_count) ?? undefined;
  }
  if (category === 'games') {
    return normalizeCount(entry.runtime) ?? normalizeCount(payload?.runtime) ?? undefined;
  }
  return undefined;
};
