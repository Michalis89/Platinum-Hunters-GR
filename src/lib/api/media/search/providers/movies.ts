import { DEFAULT_COVER, UNTITLED_FALLBACK } from '@/lib/constants/messages';
import { EXTERNAL_API_REVALIDATE_SECONDS } from '@/lib/constants/cache';
import type { MediaSearchConfig, SearchLocalItem } from '../../handlers/search';

type MoviesCategory = 'movies' | 'tv';

type TmdbMedia = {
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

const mapLocalItem = (item: SearchLocalItem) => {
  const title =
    (item.title as string | undefined) ||
    (item.original_title as string | undefined) ||
    (item.title_english as string | undefined) ||
    (item.title_romaji as string | undefined) ||
    (item.title_native as string | undefined) ||
    UNTITLED_FALLBACK;
  const subtitle =
    (item.original_title as string | undefined) ||
    (item.title_english as string | undefined) ||
    '';
  const tmdbId = item.tmdb_id as number | undefined;
  const year =
    (item.release_date as string | undefined)?.slice(0, 4) ||
    (item.first_air_date as string | undefined)?.slice(0, 4);

  return {
    source: 'local',
    id: `local-${item.id}`,
    mediaId: item.id,
    externalId: tmdbId,
    title,
    subtitle,
    year,
    status: 'planned',
    score: null,
    tags: (item.genres as string[] | undefined) ?? [],
    cover:
      (item.cover_image_large as string | undefined) ||
      (item.cover_image_medium as string | undefined) ||
      DEFAULT_COVER,
  };
};

const mapTmdbItem = (media: TmdbMedia, category: MoviesCategory) => {
  const title = media.title || media.name || UNTITLED_FALLBACK;
  const original = media.original_title || media.original_name || '';
  const year = (media.release_date || media.first_air_date || '').slice(0, 4) || undefined;
  const poster = media.poster_path ? `${TMDB_IMAGE_BASE}w780${media.poster_path}` : null;
  const posterSmall = media.poster_path ? `${TMDB_IMAGE_BASE}w342${media.poster_path}` : null;
  const backdrop = media.backdrop_path ? `${TMDB_IMAGE_BASE}w1280${media.backdrop_path}` : null;

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
};

const normalizeSearchTerm = (value: string) => {
  return value
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const fetchTmdb = async (
  search: string,
  { category, limit }: { category: MoviesCategory; limit: number },
) => {
  const apiKey = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || '';
  if (!apiKey) {
    console.warn('Missing TMDB API key');
    return [] as TmdbMedia[];
  }

  const base = category === 'movies' ? 'movie' : 'tv';
  const url = new URL(`https://api.themoviedb.org/3/search/${base}`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('query', search);
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('page', '1');

  const response = await fetch(url.toString(), {
    next: { revalidate: EXTERNAL_API_REVALIDATE_SECONDS },
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.warn('TMDB error:', errorBody);
    return [] as TmdbMedia[];
  }

  const result = (await response.json()) as { results?: TmdbMedia[] };
  return (result.results ?? []).slice(0, limit);
};

export const moviesSearchConfig: MediaSearchConfig<
  MoviesCategory,
  TmdbMedia,
  ReturnType<typeof mapLocalItem> | ReturnType<typeof mapTmdbItem>
> = {
  defaultCategory: 'movies',
  supportedCategories: ['movies', 'tv'],
  limit: 12,
  logPrefix: 'TMDB',
  buildLocalOrFilter: query => `title.ilike.%${query}%,original_title.ilike.%${query}%`,
  mapLocalItem,
  mapExternalItem: mapTmdbItem,
  getLocalExternalId: item => {
    const tmdbId = item.tmdb_id;
    return typeof tmdbId === 'number' ? tmdbId : null;
  },
  getExternalId: item => item.id,
  fetchExternal: fetchTmdb,
  normalizeSearchTerm,
};
