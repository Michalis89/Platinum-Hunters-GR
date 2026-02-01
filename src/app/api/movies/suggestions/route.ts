import { withApiRoute } from '@/lib/observability/withApiRoute';

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

type Category = 'movies' | 'tv';

type SuggestionRow = {
  media_id: number;
  score: number | null;
  media_items: {
    id: number;
    category: Category;
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
  } | null;
};

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

const mapSuggestedItem = (
  media: NonNullable<SuggestionRow['media_items']>,
  average: number,
) => {
  const title =
    media.title ||
    media.original_title ||
    media.title_english ||
    media.title_romaji ||
    media.title_native ||
    'Untitled';
  const subtitle =
    media.original_title && media.original_title !== title ? media.original_title : '';
  const year =
    media.release_date?.slice(0, 4) ||
    media.first_air_date?.slice(0, 4) ||
    undefined;
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
    cover: media.cover_image_large || media.cover_image_medium || '/og-image.png',
    totalRuntime: media.runtime ?? undefined,
    totalEpisodes: media.number_of_episodes ?? undefined,
    description: media.description ?? undefined,
  };
};

const mapPopularItem = (media: TmdbMedia, category: Category) => {
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

const fetchPopular = async (category: Category, limit: number) => {
  const apiKey = getTmdbApiKey();
  if (!apiKey) {
    console.warn('Missing TMDB API key');
    return [] as TmdbMedia[];
  }
  const base = category === 'movies' ? 'movie' : 'tv';
  const url = new URL(`https://api.themoviedb.org/3/${base}/popular`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('page', '1');

  const response = await fetch(url.toString(), { cache: 'no-store' });
  if (!response.ok) {
    const errorBody = await response.text();
    console.warn('TMDB popular error:', errorBody);
    return [] as TmdbMedia[];
  }
  const result = (await response.json()) as { results?: TmdbMedia[] };
  return (result.results ?? []).slice(0, limit);
};

async function GETHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get('category') || 'movies') as Category;

    if (category !== 'movies' && category !== 'tv') {
      return NextResponse.json({ error: 'Unsupported category' }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Μη εξουσιοδοτημένη πρόσβαση' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's existing media IDs to exclude from suggestions
    const { data: userEntries } = await supabase
      .from('user_media_entries')
      .select('media_id, media_items!inner(category)')
      .eq('user_id', userId)
      .eq('media_items.category', category);

    const userMediaIds = new Set(
      (userEntries ?? []).map((e: { media_id: number }) => e.media_id)
    );

    const { data, error } = await supabase
      .from('user_media_entries')
      .select(
        'media_id,score,media_items!inner(id,category,title,original_title,title_english,title_romaji,title_native,description,release_date,first_air_date,runtime,number_of_episodes,cover_image_large,cover_image_medium,genres)',
      )
      .eq('media_items.category', category)
      .not('score', 'is', null);

    if (error) {
      throw error;
    }

    const buckets = new Map<
      number,
      { sum: number; count: number; media: NonNullable<SuggestionRow['media_items']> }
    >();

    let globalSum = 0;
    let globalCount = 0;
    (data as SuggestionRow[] | null)?.forEach(row => {
      if (!row.media_items || row.score === null) return;
      globalSum += row.score;
      globalCount += 1;
      const current = buckets.get(row.media_id);
      if (current) {
        current.sum += row.score;
        current.count += 1;
      } else {
        buckets.set(row.media_id, {
          sum: row.score,
          count: 1,
          media: row.media_items,
        });
      }
    });

    const globalAverage = globalCount > 0 ? globalSum / globalCount : 0;
    // Lower minimumVotes to show items even with few ratings
    const minimumVotes = 2;

    const suggestions = Array.from(buckets.values())
      // Filter out items the user already has
      .filter(item => !userMediaIds.has(item.media.id))
      .map(item => ({
        average: item.sum / item.count,
        weighted:
          item.count + minimumVotes > 0
            ? (item.count / (item.count + minimumVotes)) * (item.sum / item.count) +
              (minimumVotes / (item.count + minimumVotes)) * globalAverage
            : 0,
        media: item.media,
      }))
      .sort((a, b) => b.weighted - a.weighted)
      .slice(0, 4)
      .map(item => mapSuggestedItem(item.media, item.weighted));

    if (suggestions.length > 0) {
      return NextResponse.json({ items: suggestions });
    }

    // Fallback to popular items, also excluding user's existing items
    const popular = await fetchPopular(category, 8);
    const filteredPopular = popular
      .filter(item => !userMediaIds.has(item.id))
      .slice(0, 4);
    return NextResponse.json({ items: filteredPopular.map(item => mapPopularItem(item, category)) });
  } catch (error) {
    console.error('Suggestions fetch error:', error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}

export const GET = withApiRoute(GETHandler);
