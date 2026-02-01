import { withApiRoute } from '@/lib/observability/withApiRoute';

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

type Category = 'books';

type GoogleBook = {
  id: string;
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    categories?: string[];
    description?: string;
    pageCount?: number;
    publishedDate?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
};

const getBooksApiKey = () => {
  return process.env.GOOGLE_BOOKS_API_KEY || '';
};

const mapLocalItem = (item: Record<string, unknown>) => {
  const title =
    (item.title as string | undefined) ||
    (item.original_title as string | undefined) ||
    'Untitled';
  const subtitle = (item.original_title as string | undefined) || '';
  const googleId = item.google_books_id as string | undefined;
  const year = (item.release_date as string | undefined)?.slice(0, 4);
  return {
    source: 'local',
    id: `local-${item.id}`,
    mediaId: item.id,
    externalId: googleId,
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

const normalizeImage = (url?: string) => {
  if (!url) return null;
  return url.startsWith('http://') ? url.replace('http://', 'https://') : url;
};

const normalizeDate = (value?: string) => {
  if (!value) return null;
  if (/^\d{4}$/.test(value)) return `${value}-01-01`;
  if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return null;
};

const mapGoogleItem = (media: GoogleBook) => {
  const info = media.volumeInfo || {};
  const title = info.title || 'Untitled';
  const subtitle = info.subtitle || (info.authors || [])[0] || '';
  const year = info.publishedDate ? info.publishedDate.slice(0, 4) : undefined;
  const coverLarge = normalizeImage(info.imageLinks?.thumbnail) ?? null;
  const coverSmall = normalizeImage(info.imageLinks?.smallThumbnail) ?? null;
  const releaseDate = normalizeDate(info.publishedDate);
  return {
    source: 'external',
    id: `google-${media.id}`,
    externalId: media.id,
    title,
    subtitle,
    year,
    status: 'planned',
    score: null,
    tags: info.categories ?? [],
    cover: coverLarge || coverSmall || '/og-image.png',
    payload: {
      google_books_id: media.id,
      category: 'books' as Category,
      source: 'google_books',
      title,
      original_title: info.subtitle || null,
      description: info.description || null,
      page_count: info.pageCount ?? null,
      release_date: releaseDate,
      cover_image_large: coverLarge,
      cover_image_medium: coverSmall,
      genres: info.categories ?? [],
      tags: info.authors ?? [],
    },
  };
};

const normalizeSearchTerm = (value: string) => {
  return value
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const fetchBooks = async (search: string, limit: number) => {
  const apiKey = getBooksApiKey();
  if (!apiKey) {
    console.warn('Missing GOOGLE_BOOKS_API_KEY');
    return [] as GoogleBook[];
  }
  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', search);
  url.searchParams.set('maxResults', String(limit));
  url.searchParams.set('printType', 'books');
  url.searchParams.set('key', apiKey);

  const response = await fetch(url.toString(), { cache: 'no-store' });
  if (!response.ok) {
    const errorBody = await response.text();
    console.warn('Google Books error:', errorBody);
    return [] as GoogleBook[];
  }

  const result = (await response.json()) as { items?: GoogleBook[] };
  return result.items ?? [];
};

async function GETHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';
    const category = (searchParams.get('category') || 'books') as Category;
    const normalized = normalizeSearchTerm(q);

    if (!q) {
      return NextResponse.json({ source: 'local', items: [] });
    }

    if (category !== 'books') {
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
      console.warn('Local books search error:', localError);
    }

    const typedLocalItems =
      localItems as Array<{ google_books_id?: string | null; [key: string]: unknown }> | null;
    const localResults = (typedLocalItems ?? []).map(mapLocalItem);
    const remaining = Math.max(12 - localResults.length, 0);
    const localIds = new Set(
      typedLocalItems?.map(item => item.google_books_id).filter(Boolean) ?? [],
    );

    let media: GoogleBook[] = [];
    if (remaining > 0) {
      media = await fetchBooks(q, 12);
      if (media.length === 0 && normalized && normalized !== q) {
        media = await fetchBooks(normalized, 12);
      }
    }

    const externalResults = media
      .filter(item => !localIds.has(item.id))
      .slice(0, remaining)
      .map(item => mapGoogleItem(item));

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

    let fallback = await fetchBooks(q, 12);
    if (fallback.length === 0 && normalized && normalized !== q) {
      fallback = await fetchBooks(normalized, 12);
    }

    return NextResponse.json({
      source: 'external',
      items: fallback.map(item => mapGoogleItem(item)),
    });
  } catch (error) {
    console.error('Books search error:', error);
    return NextResponse.json({ source: 'external', items: [] }, { status: 500 });
  }
}

export const GET = withApiRoute(GETHandler);
