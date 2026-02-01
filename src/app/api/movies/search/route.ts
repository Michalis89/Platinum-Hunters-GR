import { withApiRoute } from '@/lib/observability/withApiRoute';

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

type Category = 'movies' | 'tv';

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

const getTmdbApiKey = () => {
  return process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || '';
};

const mapLocalItem = (item: Record<string, unknown>) => {
  const title =
    (item.title as string | undefined) ||
    (item.original_title as string | undefined) ||
    (item.title_english as string | undefined) ||
    (item.title_romaji as string | undefined) ||
    (item.title_native as string | undefined) ||
    'Untitled';
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
      '/og-image.png',
  };
};

const mapTmdbItem = (media: TmdbMedia, category: Category) => {
  const title = media.title || media.name || 'Untitled';
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
    cover: poster || posterSmall || '/og-image.png',
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

const fetchTmdb = async (search: string, category: Category, limit: number) => {
  const apiKey = getTmdbApiKey();
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

  const response = await fetch(url.toString(), { cache: 'no-store' });
  if (!response.ok) {
    const errorBody = await response.text();
    console.warn('TMDB error:', errorBody);
    return [] as TmdbMedia[];
  }

  const result = (await response.json()) as { results?: TmdbMedia[] };
  return (result.results ?? []).slice(0, limit);
};

async function GETHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';
    const category = (searchParams.get('category') || 'movies') as Category;
    const normalized = normalizeSearchTerm(q);

    if (!q) {
      return NextResponse.json({ source: 'local', items: [] });
    }

    if (category !== 'movies' && category !== 'tv') {
      return NextResponse.json({ error: 'Unsupported category' }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    const { data: localItems, error: localError } = await supabase
      .from('media_items')
      .select('*')
      .eq('category', category)
      .or(`title.ilike.%${q}%,original_title.ilike.%${q}%`)
      .limit(12);

    if (localError) {
      console.warn('Local media search error:', localError);
    }

    const typedLocalItems =
      localItems as Array<{ tmdb_id?: number | null; [key: string]: unknown }> | null;
    const localResults = (typedLocalItems ?? []).map(mapLocalItem);
    const remaining = Math.max(12 - localResults.length, 0);
    const localIds = new Set(
      typedLocalItems
        ?.map(item => item.tmdb_id as number | null)
        .filter((id): id is number => typeof id === 'number') ?? [],
    );

    let media: TmdbMedia[] = [];
    if (remaining > 0) {
      media = await fetchTmdb(q, category, 12);
      if (media.length === 0 && normalized && normalized !== q) {
        media = await fetchTmdb(normalized, category, 12);
      }
    }

    const externalResults = media
      .filter(item => !localIds.has(item.id))
      .slice(0, remaining)
      .map(item => mapTmdbItem(item, category));

    if (localResults.length > 0 || externalResults.length > 0) {
      const source =
        localResults.length > 0 && externalResults.length > 0
          ? 'mixed'
          : localResults.length > 0
            ? 'local'
            : 'external';
      return NextResponse.json({
        source,
        items: [...localResults, ...externalResults],
      });
    }

    let fallback = await fetchTmdb(q, category, 12);
    if (fallback.length === 0 && normalized && normalized !== q) {
      fallback = await fetchTmdb(normalized, category, 12);
    }

    return NextResponse.json({
      source: 'external',
      items: fallback.map(item => mapTmdbItem(item, category)),
    });
  } catch (error) {
    console.error('TMDB search error:', error);
    return NextResponse.json({ source: 'external', items: [] }, { status: 500 });
  }
}

export const GET = withApiRoute(GETHandler);
