/**
 * RAWG API Service
 * Handles game search and data mapping for the games backlog
 */

import { UNTITLED_FALLBACK, DEFAULT_COVER } from '@/lib/constants/messages';

export type RawgGame = {
  id: number;
  slug: string;
  name: string;
  released?: string | null;
  background_image?: string | null;
  rating?: number | null;
  metacritic?: number | null;
  playtime?: number | null;
  esrb_rating?: { name: string } | null;
  platforms?: { platform: { id: number; name: string; slug: string } }[] | null;
  genres?: { id: number; name: string; slug: string }[] | null;
  developers?: { id: number; name: string; slug: string }[] | null;
  publishers?: { id: number; name: string; slug: string }[] | null;
  description_raw?: string | null;
};

export type GameSearchResult = {
  source: 'local' | 'external';
  id: string;
  mediaId?: number;
  externalId?: number;
  title: string;
  subtitle: string;
  year?: string;
  status: string;
  score: string | null;
  tags: string[];
  cover: string;
  payload?: GamePayload;
};

export type GamePayload = {
  rawg_id: number;
  category: 'games';
  source: 'rawg';
  title: string;
  description: string | null;
  cover_image_large: string | null;
  cover_image_medium: string | null;
  season_year: number | null;
  release_date: string | null;
  rating: number | null;
  metacritic: number | null;
  platforms: string[] | null;
  genres: string[] | null;
  developer: string | null;
  publisher: string | null;
  esrb_rating: string | null;
  runtime: number | null;
};

const RAWG_API_KEY = process.env.RAWG_API_KEY || '';

export async function searchRawgGames(query: string, limit = 12): Promise<RawgGame[]> {
  if (!RAWG_API_KEY) {
    console.warn('Missing RAWG_API_KEY');
    return [];
  }

  try {
    const url = new URL('https://api.rawg.io/api/games');
    url.searchParams.set('key', RAWG_API_KEY);
    url.searchParams.set('search', query);
    url.searchParams.set('page_size', String(limit));

    const response = await fetch(url.toString(), {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn('RAWG error:', errorBody);
      return [];
    }

    const result = (await response.json()) as { results?: RawgGame[] };
    return result.results ?? [];
  } catch (error) {
    console.error('RAWG fetch error:', error);
    return [];
  }
}

export async function fetchRawgGameDetails(rawgId: number): Promise<RawgGame | null> {
  if (!RAWG_API_KEY || !Number.isFinite(rawgId) || rawgId <= 0) {
    return null;
  }

  try {
    const url = new URL(`https://api.rawg.io/api/games/${rawgId}`);
    url.searchParams.set('key', RAWG_API_KEY);

    const response = await fetch(url.toString(), {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn('RAWG details error:', errorBody);
      return null;
    }

    return (await response.json()) as RawgGame;
  } catch (error) {
    console.error('RAWG details fetch error:', error);
    return null;
  }
}

export function mapRawgToSearchResult(game: RawgGame): GameSearchResult {
  const year = game.released?.slice(0, 4);
  const developer = game.developers?.[0]?.name ?? '';

  return {
    source: 'external',
    id: `rawg-${game.id}`,
    externalId: game.id,
    title: game.name,
    subtitle: developer,
    year,
    status: 'planned',
    score: game.metacritic?.toString() ?? game.rating?.toFixed(1) ?? null,
    tags: game.genres?.map(g => g.name) ?? [],
    cover: game.background_image ?? DEFAULT_COVER,
    payload: mapRawgToPayload(game),
  };
}

export function mapRawgToPayload(game: RawgGame): GamePayload {
  const year = game.released?.slice(0, 4);

  return {
    rawg_id: game.id,
    category: 'games',
    source: 'rawg',
    title: game.name,
    description: game.description_raw ?? null,
    cover_image_large: game.background_image ?? null,
    cover_image_medium: game.background_image ?? null,
    season_year: year ? parseInt(year, 10) : null,
    release_date: game.released ?? null,
    rating: game.rating ?? null,
    metacritic: game.metacritic ?? null,
    platforms: game.platforms?.map(p => p.platform.name) ?? null,
    genres: game.genres?.map(g => g.name) ?? null,
    developer: game.developers?.[0]?.name ?? null,
    publisher: game.publishers?.[0]?.name ?? null,
    esrb_rating: game.esrb_rating?.name ?? null,
    runtime: game.playtime ?? null,
  };
}

export function mapLocalGameItem(item: Record<string, unknown>): GameSearchResult {
  const title = (item.title as string | undefined) || UNTITLED_FALLBACK;
  const subtitle = (item.developer as string | undefined) || '';
  const rawgId = item.rawg_id as number | undefined;

  return {
    source: 'local',
    id: `local-${item.id}`,
    mediaId: item.id as number,
    externalId: rawgId,
    title,
    subtitle,
    year: item.season_year ? String(item.season_year) : undefined,
    status: 'planned',
    score: item.metacritic ? String(item.metacritic) : null,
    tags: (item.genres as string[] | undefined) ?? [],
    cover:
      (item.cover_image_large as string | undefined) ||
      (item.cover_image_medium as string | undefined) ||
      DEFAULT_COVER,
  };
}
