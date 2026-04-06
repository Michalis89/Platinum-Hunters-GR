import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { UnauthorizedError } from '@/lib/api/auth';
import { ForbiddenError, requireAdminRole } from '@/lib/api/permissions';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import { cachedExternalFetch } from '@/lib/api-cache/external';
import { EXTERNAL_API_REVALIDATE_SECONDS } from '@/lib/constants/cache';

type TmdbCategory = 'movies' | 'tv';

type TmdbListItem = {
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

type TmdbListResponse = {
  results?: TmdbListItem[];
};

type TmdbDetailsResponse = {
  runtime?: number | null;
  episode_run_time?: number[] | null;
  number_of_seasons?: number | null;
  number_of_episodes?: number | null;
  genres?: { id: number; name: string }[] | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
};

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';
const DEFAULT_COUNT = 200;
const MAX_COUNT = 500;
const DEFAULT_MAX_SCAN_PAGES = 120;
const TMDB_MAX_PAGE = 500;
const DETAIL_CONCURRENCY = 4;
const CURSOR_TTL_SECONDS = 10 * 365 * 24 * 60 * 60;

function getTmdbApiKey(): string | null {
  const key = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
  return typeof key === 'string' && key.trim().length > 0 ? key.trim() : null;
}

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  limit: number,
  mapper: (item: TInput, index: number) => Promise<TOutput>,
): Promise<TOutput[]> {
  const safeLimit = Math.max(1, limit);
  const results: TOutput[] = new Array(items.length);
  let readIndex = 0;

  const worker = async () => {
    while (readIndex < items.length) {
      const current = readIndex++;
      results[current] = await mapper(items[current], current);
    }
  };

  await Promise.all(Array.from({ length: Math.min(safeLimit, items.length) }, () => worker()));
  return results;
}

async function fetchPopularPage(
  category: TmdbCategory,
  page: number,
  apiKey: string,
): Promise<TmdbListItem[]> {
  const base = category === 'movies' ? 'movie' : 'tv';
  const url = new URL(`https://api.themoviedb.org/3/${base}/popular`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('page', String(page));

  const payload = await cachedExternalFetch<TmdbListResponse>({
    apiName: `tmdb-popular-${category}-page-${page}`,
    endpoint: url.toString(),
    ttlSeconds: EXTERNAL_API_REVALIDATE_SECONDS,
  });

  return Array.isArray(payload.results) ? payload.results : [];
}

function getCursorKey(category: TmdbCategory): string {
  return `admin-tmdb-import-cursor:${category}`;
}

async function loadImportCursor(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  category: TmdbCategory,
): Promise<number> {
  const { data, error } = await admin
    .from('api_cache')
    .select('data')
    .eq('key', getCursorKey(category))
    .maybeSingle();

  if (error) {
    console.warn('[Admin TMDB Import] Failed to load cursor:', error.message);
    return 1;
  }

  const raw = (data?.data as { nextPage?: unknown } | null)?.nextPage;
  const nextPage = Number.parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(nextPage) || nextPage < 1 || nextPage > TMDB_MAX_PAGE) {
    return 1;
  }
  return nextPage;
}

async function saveImportCursor(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  category: TmdbCategory,
  nextPage: number,
): Promise<void> {
  /* c8 ignore next 2 -- defensive normalization; handler keeps page bounded within 1..TMDB_MAX_PAGE */
  /* istanbul ignore next -- defensive normalization; handler keeps page bounded within 1..TMDB_MAX_PAGE */
  const normalizedPage =
    Number.isFinite(nextPage) && nextPage >= 1 && nextPage <= TMDB_MAX_PAGE ? nextPage : 1;
  const expiresAt = new Date(Date.now() + CURSOR_TTL_SECONDS * 1000).toISOString();

  const { error } = await admin.from('api_cache').upsert({
    key: getCursorKey(category),
    data: { nextPage: normalizedPage },
    expires_at: expiresAt,
  });

  if (error) {
    console.warn('[Admin TMDB Import] Failed to save cursor:', error.message);
  }
}

async function insertMediaRow(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  row: Record<string, unknown>,
): Promise<boolean> {
  const tmdbId = row.tmdb_id;
  /* c8 ignore start -- defensive guard; rows are produced from validated positive TMDB IDs */
  /* istanbul ignore next -- defensive guard; rows are produced from validated positive TMDB IDs */
  if (typeof tmdbId !== 'number' || !Number.isFinite(tmdbId)) {
    return false;
  }
  /* c8 ignore stop */

  const { error } = await admin.from('media_items').insert(row as never);
  return !error;
}

async function fetchDetails(
  category: TmdbCategory,
  tmdbId: number,
  apiKey: string,
): Promise<TmdbDetailsResponse> {
  const base = category === 'movies' ? 'movie' : 'tv';
  const url = new URL(`https://api.themoviedb.org/3/${base}/${tmdbId}`);
  url.searchParams.set('api_key', apiKey);

  return await cachedExternalFetch<TmdbDetailsResponse>({
    apiName: `tmdb-details-${category}-${tmdbId}`,
    endpoint: url.toString(),
    ttlSeconds: EXTERNAL_API_REVALIDATE_SECONDS,
  });
}

function buildMediaRow(
  category: TmdbCategory,
  item: TmdbListItem,
  details: TmdbDetailsResponse,
): Record<string, unknown> {
  const title = item.title || item.name || 'Untitled';
  const originalTitle = item.original_title || item.original_name || null;
  const runtime =
    category === 'movies'
      ? (details.runtime ?? null)
      : Array.isArray(details.episode_run_time) && details.episode_run_time.length > 0
        ? (details.episode_run_time[0] ?? null)
        : null;

  const posterPath = details.poster_path ?? item.poster_path ?? null;
  const backdropPath = details.backdrop_path ?? item.backdrop_path ?? null;

  return {
    category,
    source: 'tmdb',
    tmdb_id: item.id,
    title,
    original_title: originalTitle,
    description: item.overview ?? null,
    release_date: item.release_date ?? null,
    first_air_date: item.first_air_date ?? null,
    runtime,
    number_of_seasons: details.number_of_seasons ?? null,
    number_of_episodes: details.number_of_episodes ?? null,
    rating: item.vote_average ?? null,
    vote_count: item.vote_count ?? null,
    popularity: item.popularity ?? null,
    cover_image_large: posterPath ? `${TMDB_IMAGE_BASE}w780${posterPath}` : null,
    cover_image_medium: posterPath ? `${TMDB_IMAGE_BASE}w342${posterPath}` : null,
    banner_image: backdropPath ? `${TMDB_IMAGE_BASE}w1280${backdropPath}` : null,
    genres: details.genres?.map(g => g.name).filter(Boolean) ?? [],
    status: 'published',
  };
}

async function POSTHandler(req: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    await requireAdminRole(supabase);
    const admin = createSupabaseAdminClient();

    const body = (await req.json().catch(() => null)) as {
      category?: TmdbCategory;
      count?: number;
      maxPages?: number;
    } | null;

    const category: TmdbCategory = body?.category === 'tv' ? 'tv' : 'movies';
    const targetCount = Math.min(Math.max(toPositiveInt(body?.count, DEFAULT_COUNT), 1), MAX_COUNT);
    const maxPages = Math.min(
      Math.max(toPositiveInt(body?.maxPages, DEFAULT_MAX_SCAN_PAGES), 1),
      TMDB_MAX_PAGE,
    );

    const apiKey = getTmdbApiKey();
    if (!apiKey) {
      return fail(
        {
          error: 'Missing TMDB API key in server environment.',
          code: 'TMDB_API_KEY_MISSING',
        },
        500,
      );
    }

    const startPage = await loadImportCursor(admin, category);
    let currentPage = startPage;
    let pagesScanned = 0;
    let inserted = 0;
    let skippedExisting = 0;
    let failed = 0;
    const seenIds = new Set<number>();

    while (inserted < targetCount && pagesScanned < maxPages) {
      const items = await fetchPopularPage(category, currentPage, apiKey);
      pagesScanned += 1;
      if (items.length === 0) {
        currentPage = currentPage >= TMDB_MAX_PAGE ? 1 : currentPage + 1;
        continue;
      }

      const pageItems = items.filter(item => Number.isFinite(item.id) && item.id > 0);
      const candidateIds = pageItems
        .map(item => item.id)
        .filter(id => !seenIds.has(id))
        .filter((id, index, arr) => arr.indexOf(id) === index);

      if (candidateIds.length === 0) {
        currentPage = currentPage >= TMDB_MAX_PAGE ? 1 : currentPage + 1;
        continue;
      }

      candidateIds.forEach(id => seenIds.add(id));
      const { data: existingRows, error: existingError } = await admin
        .from('media_items')
        .select('tmdb_id')
        .eq('category', category)
        .in('tmdb_id', candidateIds);

      if (existingError) {
        console.error('[Admin TMDB Import] Existing IDs query error:', existingError);
        return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
      }

      const existingIds = new Set(
        (existingRows ?? [])
          .map(row => row.tmdb_id)
          .filter((value): value is number => typeof value === 'number' && Number.isFinite(value)),
      );
      skippedExisting += existingIds.size;

      const idToItem = new Map<number, TmdbListItem>(pageItems.map(item => [item.id, item]));

      const newIds = candidateIds.filter(id => !existingIds.has(id));

      if (newIds.length === 0) {
        currentPage = currentPage >= TMDB_MAX_PAGE ? 1 : currentPage + 1;
        continue;
      }

      const upsertRows = await mapWithConcurrency(newIds, DETAIL_CONCURRENCY, async id => {
        const item = idToItem.get(id);
        /* c8 ignore start -- defensive guard; map is built from the same candidate ID set */
        /* istanbul ignore next -- defensive guard; map is built from the same candidate ID set */
        if (!item) {
          return null;
        }
        /* c8 ignore stop */
        try {
          const details = await fetchDetails(category, id, apiKey);
          return {
            row: buildMediaRow(category, item, details),
          };
        } catch (error) {
          failed += 1;
          console.error(`[Admin TMDB Import] Failed to fetch details for ${category}:${id}`, error);
          return null;
        }
      });

      const validRows = upsertRows.filter(
        (entry): entry is { row: Record<string, unknown> } => entry !== null,
      );

      for (const entry of validRows) {
        const insertedOk = await insertMediaRow(admin, entry.row);
        if (!insertedOk) {
          failed += 1;
          /* c8 ignore next 3 -- defensive nullish logging; successful buildMediaRow always sets numeric tmdb_id */
          /* istanbul ignore next -- defensive nullish logging; successful buildMediaRow always sets numeric tmdb_id */
          console.error('[Admin TMDB Import] Persist error for row:', {
            category,
            tmdbId: entry.row.tmdb_id ?? null,
          });
          continue;
        }

        inserted += 1;
        if (inserted >= targetCount) {
          break;
        }
      }

      currentPage = currentPage >= TMDB_MAX_PAGE ? 1 : currentPage + 1;
    }

    await saveImportCursor(admin, category, currentPage);

    return ok({
      category,
      requested: targetCount,
      inserted,
      skippedExisting,
      failed,
      pagesScanned,
      startPage,
      nextCursorPage: currentPage,
      reachedTarget: inserted >= targetCount,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    if (error instanceof ForbiddenError) {
      return fail(API_ERRORS.FORBIDDEN, API_ERRORS.FORBIDDEN.status);
    }
    console.error('[Admin TMDB Import] Error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const POST = withApiRoute(POSTHandler);
