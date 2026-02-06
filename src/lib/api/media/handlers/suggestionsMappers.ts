import { UNTITLED_FALLBACK, DEFAULT_COVER } from '@/lib/constants/messages';
import { EXTERNAL_API_REVALIDATE_SECONDS } from '@/lib/constants/cache';

/**
 * Media item types for each category (based on select fields)
 */

export type AnimeMediaItem = {
  id: number;
  category: 'anime' | 'manga';
  title_english: string | null;
  title_romaji: string | null;
  title_native: string | null;
  description: string | null;
  format: string | null;
  season_year: number | null;
  episodes: number | null;
  chapters: number | null;
  volumes: number | null;
  start_date: string | null;
  cover_image_large: string | null;
  cover_image_medium: string | null;
  genres: string[] | null;
};

export type BooksMediaItem = {
  id: number;
  category: 'books';
  title: string | null;
  original_title: string | null;
  description: string | null;
  release_date: string | null;
  page_count: number | null;
  cover_image_large: string | null;
  cover_image_medium: string | null;
  genres: string[] | null;
  tags: string[] | null;
};

export type GamesMediaItem = {
  id: number;
  category: string;
  title: string | null;
  title_english: string | null;
  description: string | null;
  season_year: number | null;
  release_date: string | null;
  cover_image_large: string | null;
  cover_image_medium: string | null;
  genres: string[] | null;
};

export type MoviesMediaItem = {
  id: number;
  category: 'movies' | 'tv';
  title: string | null;
  original_title: string | null;
  title_english: string | null;
  title_romaji: string | null;
  title_native: string | null;
  description: string | null;
  release_date: string | null;
  first_air_date: string | null;
  runtime: number | null;
  number_of_episodes: number | null;
  cover_image_large: string | null;
  cover_image_medium: string | null;
  genres: string[] | null;
};

/**
 * TMDB types for movies fallback
 */
export type TmdbMedia = {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string | null;
  release_date?: string | null;
  first_air_date?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number | null;
  vote_count?: number | null;
  popularity?: number | null;
};

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

/**
 * Anime/Manga mapper
 */
export function mapAnimeSuggestion(media: AnimeMediaItem, average: number) {
  const title =
    media.title_english || media.title_romaji || media.title_native || UNTITLED_FALLBACK;
  const subtitle = media.title_romaji || media.title_english || '';
  const year = media.season_year?.toString() || media.start_date?.slice(0, 4) || undefined;

  return {
    source: 'local',
    id: `suggest-${media.id}`,
    mediaId: media.id,
    title,
    subtitle,
    year,
    status: 'planned',
    score: average.toFixed(1),
    tags: media.genres ?? [],
    cover: media.cover_image_large || media.cover_image_medium || DEFAULT_COVER,
    totalEpisodes: media.episodes ?? undefined,
    totalChapters: media.chapters ?? undefined,
    totalVolumes: media.volumes ?? undefined,
    format: media.format ?? undefined,
    description: media.description ?? undefined,
  };
}

/**
 * Books mapper
 */
export function mapBooksSuggestion(media: BooksMediaItem, average: number) {
  const title = media.title || media.original_title || UNTITLED_FALLBACK;
  const subtitle = (media.tags && media.tags.length > 0 ? media.tags.join(', ') : '') || '';
  const year = media.release_date?.slice(0, 4) || undefined;

  return {
    source: 'local',
    id: `suggest-${media.id}`,
    mediaId: media.id,
    title,
    subtitle,
    year,
    status: 'planned',
    score: average.toFixed(1),
    tags: media.genres ?? [],
    cover: media.cover_image_large || media.cover_image_medium || DEFAULT_COVER,
    totalPages: media.page_count ?? undefined,
    description: media.description ?? undefined,
  };
}

/**
 * Games mapper
 */
export function mapGamesSuggestion(
  media: GamesMediaItem,
  average: number,
  userCount?: number,
) {
  const title = media.title || media.title_english || UNTITLED_FALLBACK;
  const year = media.season_year?.toString() || media.release_date?.slice(0, 4) || undefined;

  return {
    source: 'local',
    id: `suggest-${media.id}`,
    mediaId: media.id,
    title,
    subtitle: userCount ? `${userCount} users` : '',
    year,
    status: 'planned',
    score: average.toFixed(1),
    tags: media.genres ?? [],
    cover: media.cover_image_large || media.cover_image_medium || DEFAULT_COVER,
    description: media.description ?? undefined,
  };
}

/**
 * Movies/TV mapper
 */
export function mapMoviesSuggestion(media: MoviesMediaItem, average: number) {
  const title =
    media.title ||
    media.original_title ||
    media.title_english ||
    media.title_romaji ||
    media.title_native ||
    UNTITLED_FALLBACK;
  const subtitle =
    media.original_title && media.original_title !== title ? media.original_title : '';
  const year =
    media.release_date?.slice(0, 4) || media.first_air_date?.slice(0, 4) || undefined;

  return {
    source: 'local',
    id: `suggest-${media.id}`,
    mediaId: media.id,
    title,
    subtitle,
    year,
    status: 'planned',
    score: average.toFixed(1),
    tags: media.genres ?? [],
    cover: media.cover_image_large || media.cover_image_medium || DEFAULT_COVER,
    totalRuntime: media.runtime ?? undefined,
    totalEpisodes: media.number_of_episodes ?? undefined,
    description: media.description ?? undefined,
  };
}

/**
 * TMDB popular item mapper (fallback for movies)
 */
export function mapTmdbPopularItem(media: TmdbMedia, category: 'movies' | 'tv') {
  const title = media.title || media.name || UNTITLED_FALLBACK;
  const original = media.original_title || media.original_name || '';
  const year = (media.release_date || media.first_air_date || '').slice(0, 4) || undefined;
  const poster = media.poster_path ? `${TMDB_IMAGE_BASE}w780${media.poster_path}` : null;
  const posterSmall = media.poster_path ? `${TMDB_IMAGE_BASE}w342${media.poster_path}` : null;
  const backdrop = media.backdrop_path
    ? `${TMDB_IMAGE_BASE}w1280${media.backdrop_path}`
    : null;

  return {
    source: 'external',
    id: `tmdb-${media.id}`,
    externalId: media.id,
    title,
    subtitle: original && original !== title ? original : '',
    year,
    status: 'planned',
    score: media.vote_average ? media.vote_average.toFixed(1) : null,
    tags: [],
    cover: poster || posterSmall || DEFAULT_COVER,
    payload: {
      tmdb_id: media.id,
      category,
      source: 'tmdb',
      title,
      original_title: original || null,
      description: media.overview || null,
      release_date: media.release_date || null,
      first_air_date: media.first_air_date || null,
      runtime: null,
      rating: media.vote_average ?? null,
      vote_count: media.vote_count ?? null,
      popularity: media.popularity ?? null,
      cover_image_large: poster,
      cover_image_medium: posterSmall,
      banner_image: backdrop,
      genres: [],
    },
  };
}

/**
 * Fetch TMDB popular items (fallback for movies)
 */
export async function fetchTmdbPopular(category: 'movies' | 'tv', limit: number) {
  const apiKey = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || '';
  if (!apiKey) {
    console.warn('Missing TMDB API key');
    return [] as TmdbMedia[];
  }

  const base = category === 'movies' ? 'movie' : 'tv';
  const url = new URL(`https://api.themoviedb.org/3/${base}/popular`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('page', '1');

  const response = await fetch(url.toString(), {
    next: { revalidate: EXTERNAL_API_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.warn('TMDB popular error:', errorBody);
    return [] as TmdbMedia[];
  }

  const result = (await response.json()) as { results?: TmdbMedia[] };
  return (result.results ?? []).slice(0, limit);
}
