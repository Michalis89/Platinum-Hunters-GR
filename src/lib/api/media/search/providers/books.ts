import { DEFAULT_COVER, UNTITLED_FALLBACK } from '@/lib/constants/messages';
import { EXTERNAL_API_REVALIDATE_SECONDS } from '@/lib/constants/cache';
import type { MediaSearchConfig, SearchLocalItem } from '../../handlers/search';

type BooksCategory = 'books';

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

const mapLocalItem = (item: SearchLocalItem) => {
  const title =
    (item.title as string | undefined) ||
    (item.original_title as string | undefined) ||
    UNTITLED_FALLBACK;
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
      DEFAULT_COVER,
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
  const title = info.title || UNTITLED_FALLBACK;
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
    cover: coverLarge || coverSmall || DEFAULT_COVER,
    payload: {
      google_books_id: media.id,
      category: 'books' as BooksCategory,
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

const fetchBooks = async (
  search: string,
  { limit }: { category: BooksCategory; limit: number },
) => {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY || '';
  if (!apiKey) {
    console.warn('Missing GOOGLE_BOOKS_API_KEY');
    return [] as GoogleBook[];
  }

  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', search);
  url.searchParams.set('maxResults', String(limit));
  url.searchParams.set('printType', 'books');
  url.searchParams.set('key', apiKey);

  const response = await fetch(url.toString(), {
    next: { revalidate: EXTERNAL_API_REVALIDATE_SECONDS },
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.warn('Google Books error:', errorBody);
    return [] as GoogleBook[];
  }

  const result = (await response.json()) as { items?: GoogleBook[] };
  return result.items ?? [];
};

export const booksSearchConfig: MediaSearchConfig<
  BooksCategory,
  GoogleBook,
  ReturnType<typeof mapLocalItem> | ReturnType<typeof mapGoogleItem>
> = {
  defaultCategory: 'books',
  supportedCategories: ['books'],
  limit: 12,
  logPrefix: 'Books',
  buildLocalOrFilter: query => `title.ilike.%${query}%,original_title.ilike.%${query}%`,
  mapLocalItem,
  mapExternalItem: mapGoogleItem,
  getLocalExternalId: item => {
    const googleId = item.google_books_id;
    return typeof googleId === 'string' ? googleId : null;
  },
  getExternalId: item => item.id,
  fetchExternal: fetchBooks,
  normalizeSearchTerm,
};
