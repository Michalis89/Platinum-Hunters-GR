import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { UnauthorizedError } from '@/lib/api/auth';
import { ForbiddenError, requireAdminRole } from '@/lib/api/permissions';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import { cachedExternalFetch } from '@/lib/api-cache/external';
import { EXTERNAL_API_REVALIDATE_SECONDS } from '@/lib/constants/cache';

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

type GoogleBooksResponse = {
  items?: GoogleBook[];
};

const DEFAULT_COUNT = 200;
const MAX_COUNT = 500;
const PAGE_LIMIT = 40;
const DEFAULT_MAX_SCAN_PAGES = 120;
const CURSOR_TTL_SECONDS = 10 * 365 * 24 * 60 * 60;
const MAX_OFFSET = 1000;
const DEFAULT_QUERY = 'subject:fiction';

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeImage(url?: string) {
  if (!url) {
    return null;
  }
  return url.startsWith('http://') ? url.replace('http://', 'https://') : url;
}

function normalizeDate(value?: string) {
  if (!value) {
    return null;
  }
  if (/^\d{4}$/.test(value)) {
    return `${value}-01-01`;
  }
  if (/^\d{4}-\d{2}$/.test(value)) {
    return `${value}-01`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return null;
}

function getCursorKey(query: string): string {
  return `admin-books-import-cursor:${query.toLowerCase()}`;
}

function isDuplicateKeyError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  return (error as { code?: string }).code === '23505';
}

async function loadImportCursor(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  query: string,
): Promise<number> {
  const { data, error } = await admin
    .from('api_cache')
    .select('data')
    .eq('key', getCursorKey(query))
    .maybeSingle();

  if (error) {
    console.warn('[Admin Books Import] Failed to load cursor:', error.message);
    return 0;
  }

  const raw = (data?.data as { nextOffset?: unknown } | null)?.nextOffset;
  const nextOffset = Number.parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(nextOffset) || nextOffset < 0 || nextOffset > MAX_OFFSET) {
    return 0;
  }
  return nextOffset;
}

async function saveImportCursor(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  query: string,
  nextOffset: number,
): Promise<void> {
  /* c8 ignore next 2 -- defensive normalization; currentOffset is already bounded before save */
  const normalized =
    Number.isFinite(nextOffset) && nextOffset >= 0 && nextOffset <= MAX_OFFSET ? nextOffset : 0;
  const expiresAt = new Date(Date.now() + CURSOR_TTL_SECONDS * 1000).toISOString();

  const { error } = await admin.from('api_cache').upsert({
    key: getCursorKey(query),
    data: { nextOffset: normalized },
    expires_at: expiresAt,
  });

  if (error) {
    console.warn('[Admin Books Import] Failed to save cursor:', error.message);
  }
}

async function fetchBooksPage(
  apiKey: string,
  query: string,
  offset: number,
): Promise<GoogleBook[]> {
  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', query);
  url.searchParams.set('maxResults', String(PAGE_LIMIT));
  url.searchParams.set('startIndex', String(Math.max(0, offset)));
  url.searchParams.set('printType', 'books');
  url.searchParams.set('orderBy', 'newest');
  url.searchParams.set('key', apiKey);

  const payload = await cachedExternalFetch<GoogleBooksResponse>({
    apiName: `google-books-catalog-${offset}`,
    endpoint: url.toString(),
    ttlSeconds: EXTERNAL_API_REVALIDATE_SECONDS,
  });

  return Array.isArray(payload.items) ? payload.items : [];
}

function buildMediaRow(book: GoogleBook): Record<string, unknown> {
  const info = book.volumeInfo || {};
  const coverLarge = normalizeImage(info.imageLinks?.thumbnail) ?? null;
  const coverSmall = normalizeImage(info.imageLinks?.smallThumbnail) ?? null;

  return {
    category: 'books',
    source: 'google_books',
    google_books_id: book.id,
    title: info.title || 'Untitled',
    original_title: info.subtitle || null,
    description: info.description || null,
    page_count: info.pageCount ?? null,
    release_date: normalizeDate(info.publishedDate),
    cover_image_large: coverLarge,
    cover_image_medium: coverSmall,
    genres: info.categories ?? [],
    tags: info.authors ?? [],
    status: 'published',
  };
}

async function insertMediaRow(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  row: Record<string, unknown>,
): Promise<'inserted' | 'duplicate' | 'failed'> {
  const { error } = await admin.from('media_items').insert(row as never);
  if (!error) {
    return 'inserted';
  }
  if (isDuplicateKeyError(error)) {
    return 'duplicate';
  }
  return 'failed';
}

async function POSTHandler(req: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    await requireAdminRole(supabase);
    const admin = createSupabaseAdminClient();

    const body = (await req.json().catch(() => null)) as {
      count?: number;
      maxPages?: number;
      query?: string;
    } | null;

    const targetCount = Math.min(Math.max(toPositiveInt(body?.count, DEFAULT_COUNT), 1), MAX_COUNT);
    const maxPages = Math.max(toPositiveInt(body?.maxPages, DEFAULT_MAX_SCAN_PAGES), 1);
    const query =
      typeof body?.query === 'string' && body.query.trim().length > 0
        ? body.query.trim()
        : DEFAULT_QUERY;

    const apiKey = process.env.GOOGLE_BOOKS_API_KEY || '';
    if (!apiKey) {
      return fail(
        {
          error: 'Missing GOOGLE_BOOKS_API_KEY in server environment.',
          code: 'GOOGLE_BOOKS_API_KEY_MISSING',
        },
        500,
      );
    }

    const startOffset = await loadImportCursor(admin, query);
    let currentOffset = startOffset;
    let pagesScanned = 0;
    let inserted = 0;
    let skippedExisting = 0;
    let failed = 0;
    const seenIds = new Set<string>();

    while (inserted < targetCount && pagesScanned < maxPages) {
      const items = await fetchBooksPage(apiKey, query, currentOffset);
      pagesScanned += 1;

      if (items.length === 0) {
        currentOffset = 0;
        break;
      }

      const candidateIds = items
        .map(item => item.id)
        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        .filter(id => !seenIds.has(id))
        .filter((id, index, arr) => arr.indexOf(id) === index);

      if (candidateIds.length === 0) {
        currentOffset = currentOffset + PAGE_LIMIT > MAX_OFFSET ? 0 : currentOffset + PAGE_LIMIT;
        /* istanbul ignore next -- loop continue branch mapping mismatch under TS transform */
        /* c8 ignore next -- instrumentation edge on loop-continue branch */
        continue;
      }

      candidateIds.forEach(id => seenIds.add(id));

      const { data: existingRows, error: existingError } = await admin
        .from('media_items')
        .select('google_books_id')
        .eq('category', 'books')
        .in('google_books_id', candidateIds);

      if (existingError) {
        console.error('[Admin Books Import] Existing IDs query error:', existingError);
        return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
      }

      const existingIds = new Set(
        (existingRows ?? [])
          .map(row => row.google_books_id)
          .filter((value): value is string => typeof value === 'string' && value.length > 0),
      );

      skippedExisting += existingIds.size;

      const idToBook = new Map<string, GoogleBook>(items.map(item => [item.id, item]));
      const newIds = candidateIds.filter(id => !existingIds.has(id));

      for (const id of newIds) {
        const book = idToBook.get(id);
        /* c8 ignore next 3 -- defensive guard; idToBook is built from the same page IDs */
        if (!book) {
          continue;
        }

        const result = await insertMediaRow(admin, buildMediaRow(book));
        if (result === 'inserted') {
          inserted += 1;
          if (inserted >= targetCount) {
            break;
          }
        } else if (result === 'duplicate') {
          skippedExisting += 1;
        } else {
          failed += 1;
          console.error('[Admin Books Import] Insert failed for row:', { googleBooksId: id });
        }
      }

      currentOffset = currentOffset + PAGE_LIMIT > MAX_OFFSET ? 0 : currentOffset + PAGE_LIMIT;
    }

    await saveImportCursor(admin, query, currentOffset);

    return ok({
      category: 'books',
      requested: targetCount,
      query,
      inserted,
      skippedExisting,
      failed,
      pagesScanned,
      startOffset,
      nextCursorOffset: currentOffset,
      reachedTarget: inserted >= targetCount,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    if (error instanceof ForbiddenError) {
      return fail(API_ERRORS.FORBIDDEN, API_ERRORS.FORBIDDEN.status);
    }
    console.error('[Admin Books Import] Error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const POST = withApiRoute(POSTHandler);
