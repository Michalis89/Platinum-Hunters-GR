import { withApiRoute } from '@/lib/observability/withApiRoute';
import { EXTERNAL_API_REVALIDATE_SECONDS } from '@/lib/constants/cache';
import { cachedExternalFetch, ExternalFetchError } from '@/lib/api-cache/external';
import { NextResponse } from 'next/server';

type Category = 'movies' | 'tv';

type TmdbCreditsResponse = {
  cast?: Array<{ name?: string | null; order?: number | null } | null> | null;
  crew?: Array<{ name?: string | null; job?: string | null; department?: string | null } | null> | null;
};

const getTmdbApiKey = () => process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || '';

const toUniqueNames = (values: Array<string | null | undefined>, limit: number) =>
  Array.from(
    new Set(
      values
        .map(value => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean),
    ),
  ).slice(0, limit);

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
    const url = new URL(`https://api.themoviedb.org/3/${base}/${tmdbId}/credits`);
    url.searchParams.set('api_key', apiKey);

    let data: TmdbCreditsResponse;
    try {
      data = await cachedExternalFetch({
        apiName: `tmdb-credits-${category}`,
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

    const crew = Array.isArray(data.crew) ? data.crew : [];
    const cast = Array.isArray(data.cast) ? data.cast : [];

    const directors = toUniqueNames(
      crew
        .filter(member => {
          const department = member?.department?.toLowerCase() ?? '';
          const job = member?.job?.toLowerCase() ?? '';
          return department === 'directing' || job === 'director';
        })
        .map(member => member?.name),
      5,
    );

    const actors = toUniqueNames(
      cast
        .slice()
        .sort((a, b) => (a?.order ?? Number.MAX_SAFE_INTEGER) - (b?.order ?? Number.MAX_SAFE_INTEGER))
        .map(member => member?.name),
      8,
    );

    return NextResponse.json({ directors, actors });
  } catch (error) {
    console.error('TMDB credits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiRoute(GETHandler);

