import { DEFAULT_COVER, UNTITLED_FALLBACK } from '@/lib/constants/messages';
import { EXTERNAL_API_REVALIDATE_SECONDS } from '@/lib/constants/cache';
import { cachedExternalFetch } from '@/lib/api-cache/external';
import type { MediaSearchConfig, SearchLocalItem } from '../../handlers/search';

type AnimeCategory = 'anime' | 'manga';

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

const mapLocalItem = (item: SearchLocalItem) => {
  const title =
    (item.title_english as string | undefined) ||
    (item.title_romaji as string | undefined) ||
    (item.title_native as string | undefined) ||
    UNTITLED_FALLBACK;
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
      DEFAULT_COVER,
  };
};

const mapMalItem = (media: MalMedia, category: AnimeCategory) => {
  const title = media.title || media.alternative_titles?.en || UNTITLED_FALLBACK;
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
    cover: media.main_picture?.large || media.main_picture?.medium || DEFAULT_COVER,
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

const fetchMal = async (
  search: string,
  { category, limit }: { category: AnimeCategory; limit: number },
) => {
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

  try {
    const result = await cachedExternalFetch<{ data?: { node: MalMedia }[] }>({
      apiName: 'mal-search',
      endpoint: url.toString(),
      ttlSeconds: EXTERNAL_API_REVALIDATE_SECONDS,
      init: {
        headers: {
          Accept: 'application/json',
          'X-MAL-CLIENT-ID': clientId,
        },
      },
    });

    return (result.data ?? []).map(item => item.node);
  } catch (error) {
    console.warn('MAL error:', error);
    return [] as MalMedia[];
  }
};

export const animeSearchConfig: MediaSearchConfig<
  AnimeCategory,
  MalMedia,
  ReturnType<typeof mapLocalItem> | ReturnType<typeof mapMalItem>
> = {
  defaultCategory: 'anime',
  supportedCategories: ['anime', 'manga'],
  limit: 12,
  logPrefix: 'Anime',
  buildLocalOrFilter: query =>
    `title_english.ilike.%${query}%,title_romaji.ilike.%${query}%,title_native.ilike.%${query}%`,
  mapLocalItem,
  mapExternalItem: mapMalItem,
  getLocalExternalId: item => {
    const malId = item.mal_id;
    return typeof malId === 'number' ? malId : null;
  },
  getExternalId: item => item.id,
  fetchExternal: fetchMal,
  normalizeSearchTerm,
};
