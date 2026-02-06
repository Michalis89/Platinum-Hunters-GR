import type { MediaPayload } from '../types';
import { MEDIA_CATEGORY_CONFIGS } from '../config';
import { EXTERNAL_API_REVALIDATE_SECONDS } from '@/lib/constants/cache';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

/**
 * Fetches additional details from TMDB API for movies/TV shows
 * Enriches payload with runtime, genres, and image URLs
 *
 * @param category - 'movies' or 'tv'
 * @param tmdbId - TMDB ID
 * @returns Partial payload with enriched data
 *
 * Extracted from movies/add/route.ts (lines 39-79)
 */
export async function fetchTmdbDetails(
  category: string,
  tmdbId: number,
): Promise<Partial<MediaPayload>> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return {};
  }

  const base = category === 'movies' ? 'movie' : 'tv';
  const url = new URL(`https://api.themoviedb.org/3/${base}/${tmdbId}`);
  url.searchParams.set('api_key', apiKey);

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: EXTERNAL_API_REVALIDATE_SECONDS },
    });
    if (!response.ok) {
      return {};
    }

    const data = (await response.json()) as {
      runtime?: number | null;
      episode_run_time?: number[] | null;
      number_of_seasons?: number | null;
      number_of_episodes?: number | null;
      genres?: { id: number; name: string }[] | null;
      poster_path?: string | null;
      backdrop_path?: string | null;
    };

    const runtime =
      category === 'movies'
        ? (data.runtime ?? null)
        : Array.isArray(data.episode_run_time) && data.episode_run_time.length > 0
          ? (data.episode_run_time[0] ?? null)
          : null;

    return {
      runtime,
      number_of_seasons: data.number_of_seasons ?? null,
      number_of_episodes: data.number_of_episodes ?? null,
      genres: data.genres?.map(item => item.name) ?? [],
      cover_image_large: data.poster_path
        ? `${TMDB_IMAGE_BASE}w780${data.poster_path}`
        : null,
      cover_image_medium: data.poster_path
        ? `${TMDB_IMAGE_BASE}w342${data.poster_path}`
        : null,
      banner_image: data.backdrop_path
        ? `${TMDB_IMAGE_BASE}w1280${data.backdrop_path}`
        : null,
    };
  } catch (error) {
    console.error('TMDB fetch error:', error);
    return {};
  }
}

/**
 * Maps game payload with category-specific fields
 * Ensures all game-specific fields are properly mapped to media_items schema
 *
 * @param payload - Raw game payload from RAWG API
 * @returns Mapped payload ready for database insert
 *
 * Extracted from games/add/route.ts (lines 112-131)
 */
export function mapGamePayload(payload: Record<string, unknown>): Record<string, unknown> {
  return {
    category: 'games',
    title: payload.title,
    title_english: payload.title,
    description: payload.description,
    cover_image_large: payload.cover_image_large,
    cover_image_medium: payload.cover_image_medium,
    season_year: payload.season_year,
    release_date: payload.release_date,
    rating: payload.rating,
    genres: payload.genres,
    // Game-specific fields
    rawg_id: payload.rawg_id,
    metacritic: payload.metacritic,
    platforms: payload.platforms,
    developer: payload.developer,
    publisher: payload.publisher,
    esrb_rating: payload.esrb_rating,
    runtime: payload.runtime,
  };
}

/**
 * Initialize enrichers in category configs
 * Called automatically when this module is imported
 */
MEDIA_CATEGORY_CONFIGS.movies.enricher = fetchTmdbDetails;
MEDIA_CATEGORY_CONFIGS.games.payloadMapper = mapGamePayload;
