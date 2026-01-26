import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

type Category = 'anime' | 'manga';

type MalMedia = {
  id: number;
  title: string;
  synopsis?: string | null;
  mean?: number | null;
  num_episodes?: number | null;
  num_chapters?: number | null;
  num_volumes?: number | null;
  media_type?: string | null;
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  main_picture?: { large?: string | null; medium?: string | null } | null;
  alternative_titles?: {
    synonyms?: string[] | null;
    en?: string | null;
    ja?: string | null;
  };
  genres?: { id: number; name: string }[] | null;
};

const MAL_FIELDS =
  'alternative_titles,synopsis,mean,num_episodes,num_chapters,num_volumes,media_type,status,start_date,end_date,genres,main_picture';

const mapLocalItem = (item: Record<string, unknown>) => {
  const title =
    (item.title_english as string | undefined) ||
    (item.title_romaji as string | undefined) ||
    (item.title_native as string | undefined) ||
    'Untitled';
  const subtitle =
    (item.title_romaji as string | undefined) || (item.title_english as string | undefined) || '';
  const malId = item.mal_id as number | undefined;
  return {
    source: 'local',
    id: `local-${item.id}`,
    mediaId: item.id,
    externalId: malId,
    title,
    subtitle,
    year: item.season_year ? String(item.season_year) : undefined,
    status: 'planned',
    score: null,
    tags: (item.genres as string[] | undefined) ?? [],
    cover:
      (item.cover_image_large as string | undefined) ||
      (item.cover_image_medium as string | undefined) ||
      '/og-image.png',
  };
};

const mapMalItem = (media: MalMedia, category: Category) => {
  const title = media.title || media.alternative_titles?.en || 'Untitled';
  const subtitle =
    media.alternative_titles?.en ||
    media.alternative_titles?.ja ||
    (media.alternative_titles?.synonyms || [])[0] ||
    '';
  const year = media.start_date?.slice(0, 4);
  const normalizeCount = (value?: number | null) =>
    typeof value === 'number' && value > 0 ? value : null;
  return {
    source: 'external',
    id: `mal-${media.id}`,
    externalId: media.id,
    title,
    subtitle,
    year,
    status: 'planned',
    score: media.mean ? media.mean.toFixed(1) : null,
    tags: media.genres?.map(g => g.name) ?? [],
    cover: media.main_picture?.large || media.main_picture?.medium || '/og-image.png',
    payload: {
      mal_id: media.id,
      category,
      source: 'mal',
      title_english: media.alternative_titles?.en || null,
      title_romaji: media.title || null,
      title_native: media.alternative_titles?.ja || null,
      description: media.synopsis || null,
      format: media.media_type || null,
      status: media.status || null,
      season: null,
      season_year: year ? Number.parseInt(year, 10) : null,
      episodes: normalizeCount(media.num_episodes),
      duration: null,
      chapters: normalizeCount(media.num_chapters),
      volumes: normalizeCount(media.num_volumes),
      start_date: media.start_date || null,
      end_date: media.end_date || null,
      cover_image_large: media.main_picture?.large || null,
      cover_image_medium: media.main_picture?.medium || null,
      banner_image: null,
      genres: media.genres?.map(g => g.name) ?? [],
      tags: media.alternative_titles?.synonyms ?? [],
      studios: [],
    },
  };
};

const normalizeSearchTerm = (value: string) => {
  return value
    .replace(/\b(vol|volume|vol\.)\b/gi, ' ')
    .replace(/[#0-9]+/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const fetchMal = async (search: string, category: Category, limit: number) => {
  const clientId = process.env.MAL_CLIENT_ID;
  if (!clientId) {
    console.warn('Missing MAL_CLIENT_ID');
    return [] as MalMedia[];
  }

  const base = category === 'anime' ? 'anime' : 'manga';
  const url = new URL(`https://api.myanimelist.net/v2/${base}`);
  url.searchParams.set('q', search);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('fields', MAL_FIELDS);

  const response = await fetch(url.toString(), {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'X-MAL-CLIENT-ID': clientId,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.warn('MAL error:', errorBody);
    return [] as MalMedia[];
  }

  const result = (await response.json()) as {
    data?: { node: MalMedia }[];
  };
  return (result.data ?? []).map(item => item.node);
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';
    const category = (searchParams.get('category') || 'anime') as Category;
    const normalized = normalizeSearchTerm(q);

    if (!q) {
      return NextResponse.json({ source: 'local', items: [] });
    }

    if (category !== 'anime' && category !== 'manga') {
      return NextResponse.json({ error: 'Unsupported category' }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    const { data: localItems, error: localError } = await supabase
      .from('media_items')
      .select('*')
      .eq('category', category)
      .or(`title_english.ilike.%${q}%,title_romaji.ilike.%${q}%,title_native.ilike.%${q}%`)
      .limit(12);

    if (localError) {
      console.warn('Local media search error:', localError);
    }

    const typedLocalItems = localItems as Array<{
      mal_id?: number | null;
      [key: string]: unknown;
    }> | null;
    const localResults = (typedLocalItems ?? []).map(mapLocalItem);
    const remaining = Math.max(12 - localResults.length, 0);
    const localIds = new Set(
      typedLocalItems
        ?.map(item => item.mal_id as number | null)
        .filter((id): id is number => typeof id === 'number') ?? [],
    );

    let media: MalMedia[] = [];
    if (remaining > 0) {
      media = await fetchMal(q, category, 12);
      if (media.length === 0) {
        if (normalized && normalized !== q) {
          media = await fetchMal(normalized, category, 12);
        }
      }
    }

    const externalResults = media
      .filter(item => !localIds.has(item.id))
      .slice(0, remaining)
      .map(item => mapMalItem(item, category));

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

    let fallback = await fetchMal(q, category, 12);
    if (fallback.length === 0 && normalized && normalized !== q) {
      fallback = await fetchMal(normalized, category, 12);
    }

    return NextResponse.json({
      source: 'external',
      items: fallback.map(item => mapMalItem(item, category)),
    });
  } catch (error) {
    console.error('Anime search error:', error);
    return NextResponse.json({ source: 'external', items: [] }, { status: 500 });
  }
}
