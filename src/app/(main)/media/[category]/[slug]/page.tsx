import { Suspense } from 'react';
import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { notFound } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { isMediaCategory } from '@/app/components/backlog/types';
import type { MediaCategory } from '@/app/components/backlog/types';
import type { MediaItem } from '@/lib/media/types';
import getSupabaseServer from '@/lib/supabase-server';
import StructuredData from '@/utils/seo/StructuredData';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import { getBreadcrumbStructuredData } from '@/utils/seo/metadata/structuredData';
import { SITE_URL } from '@/config/site';
import { buildMediaJsonLd } from '@/lib/seo/jsonld';
import MediaDetailPageClient from './MediaDetailPageClient';

type MediaDetailPageProps = {
  params: Promise<{ category: string; slug: string }>;
};

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;
const MEDIA_REVALIDATE_SECONDS = 3600;

const MEDIA_CATEGORY_LABELS: Record<MediaCategory, string> = {
  anime: 'Anime',
  manga: 'Manga',
  books: 'Books',
  movies: 'Movies',
  tv: 'TV',
  games: 'Games',
};

const selectFields =
  'id,category,status,updated_at,title,original_title,title_english,title_romaji,title_native,description,summary,storyline,format,season_year,start_date,first_release_date,release_date,first_air_date,cover_image_id,cover_url_thumb,cover_url_big,cover_image_large,cover_image_medium,banner_image,genres,episodes,chapters,volumes,runtime,number_of_episodes,page_count,rating,rating_count,aggregated_rating,aggregated_rating_count,popularity,mal_id,tmdb_id,google_books_id,rawg_id,igdb_id,igdb_category,igdb_slug,platforms,developer,publisher,metacritic,esrb_rating,igdb_themes,igdb_game_modes,igdb_player_perspectives,igdb_artwork_image_ids,igdb_screenshot_image_ids,official_website,igdb_updated_at,websites';

const resolveMediaTitle = (item: MediaItem) =>
  item.title || item.title_english || item.title_romaji || item.title_native || item.original_title;

const resolveMediaDescription = (item: MediaItem) =>
  item.summary || item.description || item.storyline || 'Explore this media entry on Hobbistas.';

const resolveMediaCover = (item: MediaItem) =>
  item.cover_url_big ||
  item.cover_image_large ||
  item.cover_image_medium ||
  item.cover_url_thumb ||
  item.banner_image ||
  undefined;

const resolveMediaPublishedAt = (item: MediaItem) =>
  item.release_date || item.start_date || item.first_air_date || item.first_release_date || null;

const isNumeric = (value: string) => /^\d+$/.test(value);
const escapeLike = (value: string) => value.replace(/[%_]/g, match => `\\${match}`);

const toCanonicalSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

const foldPossessiveSlug = (value: string) => value.replace(/([a-z0-9])-s-(?=[a-z0-9])/g, '$1s-');

const buildSlugCandidates = (value: string): string[] => {
  const canonical = toCanonicalSlug(value);
  if (!canonical) {return [];}

  const folded = foldPossessiveSlug(canonical);
  return Array.from(new Set([canonical, folded].filter(Boolean)));
};

const toLooseTitleLikePattern = (canonicalSlug: string) => {
  const tokens = canonicalSlug.split('-').filter(Boolean).map(escapeLike);
  return tokens.join('%');
};

const collectCandidateSlugs = (item: MediaItem): string[] => {
  const candidates = [
    item.igdb_slug,
    item.title,
    item.original_title,
    item.title_english,
    item.title_romaji,
    item.title_native,
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .flatMap(value => buildSlugCandidates(value))
    .filter(Boolean);

  return Array.from(new Set(candidates));
};

const scoreSlugMatch = (target: string, item: MediaItem): number => {
  const slugs = collectCandidateSlugs(item);
  if (slugs.includes(target)) {return 1000;}

  const prefixVariant = slugs.some(
    slug => slug.startsWith(`${target}-`) || target.startsWith(`${slug}-`),
  );
  if (prefixVariant) {return 700;}

  const includesVariant = slugs.some(slug => slug.includes(target) || target.includes(slug));
  if (includesVariant) {return 500;}

  return 0;
};

const resolveCanonicalSlug = (item: MediaItem, fallbackSlug: string) => {
  const titleCandidate =
    item.igdb_slug ||
    item.title ||
    item.title_english ||
    item.title_romaji ||
    item.title_native ||
    item.original_title ||
    fallbackSlug;

  return toCanonicalSlug(titleCandidate) || toCanonicalSlug(fallbackSlug) || fallbackSlug;
};

const fetchPublishedMediaItemCached = unstable_cache(
  async (category: string, slug: string): Promise<MediaItem | null> => {
    try {
      const supabase = getSupabaseServer();

      const fetchById = async (id: number) => {
        let query = supabase
          .from('media_items')
          .select(selectFields)
          .eq('category', category);

        // Only filter by 'published' status for non-anime/manga categories
        if (category !== 'anime' && category !== 'manga') {
          query = query.or('status.eq.published,status.is.null');
        }

        const { data, error } = await query.eq('id', id).maybeSingle();

        if (error) {throw error;}
        return data as MediaItem | null;
      };

      const fetchByExternalId = async (externalId: number | string) => {
        let query = supabase
          .from('media_items')
          .select(selectFields)
          .eq('category', category);

        // Only filter by 'published' status for non-anime/manga categories
        if (category !== 'anime' && category !== 'manga') {
          query = query.or('status.eq.published,status.is.null');
        }

        if (category === 'anime' || category === 'manga') {
          const numericId = Number(externalId);
          if (!Number.isFinite(numericId)) {return null;}
          query = query.eq('mal_id', numericId);
        } else if (category === 'movies' || category === 'tv') {
          const numericId = Number(externalId);
          if (!Number.isFinite(numericId)) {return null;}
          query = query.eq('tmdb_id', numericId);
        } else if (category === 'games') {
          const numericId = Number(externalId);
          if (!Number.isFinite(numericId)) {return null;}
          query = query.eq('igdb_id', numericId);
        } else if (category === 'books') {
          query = query.eq('google_books_id', String(externalId));
        }

        const { data, error } = await query.maybeSingle();
        if (error) {throw error;}
        return data as MediaItem | null;
      };

      const fetchBySlug = async () => {
        const isGamesCategory = category === 'games';
        const slugCandidates = buildSlugCandidates(slug);
        const canonicalSlug = slugCandidates[0] ?? '';
        const slugText = escapeLike(slug.replace(/[-_]/g, ' ').trim());
        if (!canonicalSlug && !slugText) {return null;}

        if (isGamesCategory && slugCandidates.length > 0) {
          const { data: exactMatches, error: exactError } = await supabase
            .from('media_items')
            .select(selectFields)
            .eq('category', category)
            .or('status.eq.published,status.is.null')
            .in('igdb_slug', slugCandidates)
            .limit(10);

          if (exactError) {throw exactError;}
          const exactRows = Array.isArray(exactMatches)
            ? (exactMatches as unknown as MediaItem[])
            : [];
          if (exactRows.length > 0) {
            return (
              exactRows
                .map(item => ({ item, score: scoreSlugMatch(canonicalSlug, item) }))
                .sort((a, b) => b.score - a.score)[0]?.item ?? exactRows[0]
            );
          }
        }

        const looseSlugForLike = escapeLike(canonicalSlug.replace(/-/g, '%'));
        const foldedLooseSlugForLike = escapeLike(
          foldPossessiveSlug(canonicalSlug).replace(/-/g, '%'),
        );
        const looseTitleLike = toLooseTitleLikePattern(canonicalSlug);
        const foldedLooseTitleLike = toLooseTitleLikePattern(foldPossessiveSlug(canonicalSlug));
        const escapedCandidates = slugCandidates.map(candidate => escapeLike(candidate));
        const gamesSlugClauses = isGamesCategory
          ? [
              ...escapedCandidates.map(candidate => `igdb_slug.ilike.%${candidate}%`),
              `igdb_slug.ilike.%${looseSlugForLike}%`,
              `igdb_slug.ilike.%${foldedLooseSlugForLike}%`,
            ]
          : [];

        const { data, error } = await supabase
          .from('media_items')
          .select(selectFields)
          .eq('category', category)
          .or(
            [
              ...gamesSlugClauses,
              `title.ilike.%${slugText}%`,
              `title.ilike.%${looseTitleLike}%`,
              `title.ilike.%${foldedLooseTitleLike}%`,
              `original_title.ilike.%${slugText}%`,
              `original_title.ilike.%${looseTitleLike}%`,
              `original_title.ilike.%${foldedLooseTitleLike}%`,
              `title_english.ilike.%${slugText}%`,
              `title_english.ilike.%${looseTitleLike}%`,
              `title_english.ilike.%${foldedLooseTitleLike}%`,
              `title_romaji.ilike.%${slugText}%`,
              `title_romaji.ilike.%${looseTitleLike}%`,
              `title_romaji.ilike.%${foldedLooseTitleLike}%`,
              `title_native.ilike.%${slugText}%`,
              `title_native.ilike.%${looseTitleLike}%`,
              `title_native.ilike.%${foldedLooseTitleLike}%`,
            ].join(','),
          )
          .limit(25);

        if (error) {throw error;}
        const rows = Array.isArray(data) ? (data as unknown as MediaItem[]) : [];

        // Filter by status after fetching - only for non-anime/manga categories
        const filteredRows = (category === 'anime' || category === 'manga')
          ? rows // Don't filter anime/manga by status
          : rows.filter(row => row.status === 'published' || row.status === null);

        if (filteredRows.length === 0) {return null;}

        const ranked = filteredRows
          .map(item => ({ item, score: scoreSlugMatch(canonicalSlug, item) }))
          .sort((a, b) => b.score - a.score);

        return ranked[0]?.item ?? null;
      };

      if (isNumeric(slug)) {
        const numericId = Number(slug);
        const byId = await fetchById(numericId);
        if (byId) {return byId;}
        return fetchByExternalId(numericId);
      }

      const bySlug = await fetchBySlug();
      if (bySlug) {return bySlug;}
      return fetchByExternalId(slug);
    } catch (error) {
      console.error('Failed to fetch media item for detail page:', error);
      return null;
    }
  },
  ['media-detail-by-category-slug'],
  { revalidate: MEDIA_REVALIDATE_SECONDS },
);

async function fetchMediaItem(category: string, slug: string): Promise<MediaItem | null> {
  return fetchPublishedMediaItemCached(category, slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const normalizedCategory = category.toLowerCase();

  if (!isMediaCategory(normalizedCategory)) {
    notFound();
  }

  const item = await fetchMediaItem(normalizedCategory, slug);
  if (!item) {
    notFound();
  }

  const title = resolveMediaTitle(item);
  if (!title) {
    notFound();
  }

  const summary = resolveMediaDescription(item);
  const coverImage = resolveMediaCover(item);
  const canonicalSlug = resolveCanonicalSlug(item, slug);

  return buildMetadata({
    title: `${title} | Hobbistas`,
    description: summary,
    path: `/media/${normalizedCategory}/${canonicalSlug}`,
    images: coverImage
      ? [{ url: coverImage, alt: title, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }]
      : undefined,
    openGraphType: 'website',
  });
}

async function MediaDetailContent({ params }: MediaDetailPageProps) {
  const { category, slug } = await params;
  const normalizedCategory = category.toLowerCase();

  if (!isMediaCategory(normalizedCategory)) {
    notFound();
  }

  const item = await fetchMediaItem(normalizedCategory, slug);
  if (!item) {
    notFound();
  }

  const title = resolveMediaTitle(item);
  if (!title) {
    notFound();
  }

  // Validate that the item has a valid ID
  if (!item.id || typeof item.id !== 'number' || !Number.isFinite(item.id)) {
    console.error('Media item missing valid ID:', { category: normalizedCategory, slug, item });
    notFound();
  }

  const description = resolveMediaDescription(item);
  const coverImage = resolveMediaCover(item);
  const publishedAt = resolveMediaPublishedAt(item);
  const modifiedAt = item.updated_at ?? publishedAt;
  const canonicalSlug = resolveCanonicalSlug(item, slug);
  const pageUrl = `${SITE_URL}/media/${normalizedCategory}/${canonicalSlug}`;
  const breadcrumb = [
    { name: 'Home', url: `${SITE_URL}/` },
    { name: MEDIA_CATEGORY_LABELS[normalizedCategory], url: pageUrl },
    { name: title, url: pageUrl },
  ];

  return (
    <>
      <StructuredData
        data={buildMediaJsonLd({
          title,
          description,
          url: pageUrl,
          image: coverImage ?? null,
          publishedAt,
          updatedAt: modifiedAt,
          category: normalizedCategory,
        })}
      />
      <StructuredData data={getBreadcrumbStructuredData(breadcrumb)} />
      <MediaDetailPageClient category={normalizedCategory} mediaItem={item} />
    </>
  );
}

export default function MediaDetailPage({ params }: MediaDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <Spinner />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
      }
    >
      <MediaDetailContent params={params} />
    </Suspense>
  );
}
