import { withApiRoute } from '@/lib/observability/withApiRoute';
import { ExternalFetchError } from '@/lib/api-cache/external';
import { fetchTmdbCredits } from '@/lib/tmdb/credits';
import { NextResponse } from 'next/server';

type Category = 'movies' | 'tv';

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

    try {
      const { directors, actors } = await fetchTmdbCredits(category, tmdbId);
      return NextResponse.json({ directors, actors });
    } catch (error) {
      if (error instanceof Error && error.message === 'Missing TMDB API key') {
        return NextResponse.json({ error: 'Missing TMDB API key' }, { status: 500 });
      }
      if (error instanceof ExternalFetchError) {
        const upstreamMessage = error.message.replace(/^\[[^\]]+\]\s*/, '');
        return NextResponse.json(
          { error: upstreamMessage || 'TMDB fetch failed' },
          { status: 502 },
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('TMDB credits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiRoute(GETHandler);
