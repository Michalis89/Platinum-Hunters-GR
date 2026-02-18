import { withApiRoute } from '@/lib/observability/withApiRoute';
import { EXTERNAL_API_REVALIDATE_SECONDS } from '@/lib/constants/cache';
import { cachedExternalFetch, ExternalFetchError } from '@/lib/api-cache/external';

import { NextResponse } from 'next/server';

type Category = 'movies' | 'tv';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

const getTmdbApiKey = () => {
  return process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || '';
};

async function GETHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get('category') || 'movies') as Category;
    const tmdbId = Number.parseInt(searchParams.get('tmdb_id') || '', 10);

    if (!Number.isFinite(tmdbId)) {
      return NextResponse.json({ error: 'Missing tmdb_id' }, { status: 400 });
    }
    if (category !== 'movies' && category !== 'tv') {
      return NextResponse.json({ error: 'Unsupported category' }, { status: 400 });
    }

    const apiKey = getTmdbApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing TMDB API key' }, { status: 500 });
    }

    const base = category === 'movies' ? 'movie' : 'tv';
    const url = new URL(`https://api.themoviedb.org/3/${base}/${tmdbId}`);
    url.searchParams.set('api_key', apiKey);

    let data: {
      runtime?: number | null;
      episode_run_time?: number[] | null;
      number_of_seasons?: number | null;
      number_of_episodes?: number | null;
      genres?: { id: number; name: string }[] | null;
      poster_path?: string | null;
      backdrop_path?: string | null;
    };
    try {
      data = await cachedExternalFetch({
        apiName: `tmdb-details-${category}`,
        endpoint: url.toString(),
        ttlSeconds: EXTERNAL_API_REVALIDATE_SECONDS,
      });
    } catch (error) {
      if (error instanceof ExternalFetchError) {
        const upstreamMessage = error.message.replace(/^\[[^\]]+\]\s*/, '');
        return NextResponse.json({ error: upstreamMessage || 'TMDB fetch failed' }, { status: 502 });
      }
      throw error;
    }

    const runtime =
      category === 'movies'
        ? (data.runtime ?? null)
        : Array.isArray(data.episode_run_time) && data.episode_run_time.length > 0
          ? (data.episode_run_time[0] ?? null)
          : null;

    return NextResponse.json({
      runtime,
      number_of_seasons: data.number_of_seasons ?? null,
      number_of_episodes: data.number_of_episodes ?? null,
      genres: data.genres?.map(item => item.name) ?? [],
      cover_image_large: data.poster_path ? `${TMDB_IMAGE_BASE}w780${data.poster_path}` : null,
      cover_image_medium: data.poster_path ? `${TMDB_IMAGE_BASE}w342${data.poster_path}` : null,
      banner_image: data.backdrop_path ? `${TMDB_IMAGE_BASE}w1280${data.backdrop_path}` : null,
    });
  } catch (error) {
    console.error('TMDB details error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiRoute(GETHandler);
