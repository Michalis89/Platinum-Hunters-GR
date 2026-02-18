import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { UnauthorizedError } from '@/lib/api/auth';
import { ForbiddenError, requireAdminRole } from '@/lib/api/permissions';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import { cachedExternalFetch } from '@/lib/api-cache/external';
import { EXTERNAL_API_REVALIDATE_SECONDS } from '@/lib/constants/cache';

type MalCategory = 'anime' | 'manga';

type MalNode = {
  id: number;
  title?: string | null;
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
  } | null;
  genres?: { id: number; name: string }[] | null;
};

type MalRankingResponse = {
  data?: Array<{ node?: MalNode | null }>;
};

const MAL_FIELDS =
  'alternative_titles,synopsis,mean,num_episodes,num_chapters,num_volumes,media_type,status,start_date,end_date,genres,main_picture';

const DEFAULT_COUNT = 200;
const MAX_COUNT = 500;
const PAGE_LIMIT = 100;
const DEFAULT_MAX_SCAN_PAGES = 120;
const CURSOR_TTL_SECONDS = 10 * 365 * 24 * 60 * 60;

function getMalClientId(): string | null {
  const value = process.env.MAL_CLIENT_ID;
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getCursorKey(category: MalCategory): string {
  return `admin-mal-import-cursor:${category}`;
}

function isDuplicateKeyError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  return (error as { code?: string }).code === '23505';
}

async function loadImportCursor(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  category: MalCategory,
): Promise<number> {
  const { data, error } = await admin
    .from('api_cache')
    .select('data')
    .eq('key', getCursorKey(category))
    .maybeSingle();

  if (error) {
    console.warn('[Admin MAL Import] Failed to load cursor:', error.message);
    return 0;
  }

  const raw = (data?.data as { nextOffset?: unknown } | null)?.nextOffset;
  const nextOffset = Number.parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(nextOffset) || nextOffset < 0) {
    return 0;
  }
  return nextOffset;
}

async function saveImportCursor(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  category: MalCategory,
  nextOffset: number,
): Promise<void> {
  const normalized = Number.isFinite(nextOffset) && nextOffset >= 0 ? nextOffset : 0;
  const expiresAt = new Date(Date.now() + CURSOR_TTL_SECONDS * 1000).toISOString();

  const { error } = await admin.from('api_cache').upsert({
    key: getCursorKey(category),
    data: { nextOffset: normalized },
    expires_at: expiresAt,
  });

  if (error) {
    console.warn('[Admin MAL Import] Failed to save cursor:', error.message);
  }
}

async function fetchRankingPage(
  category: MalCategory,
  clientId: string,
  offset: number,
): Promise<MalNode[]> {
  const base = category === 'manga' ? 'manga' : 'anime';
  const url = new URL(`https://api.myanimelist.net/v2/${base}/ranking`);
  url.searchParams.set('ranking_type', 'all');
  url.searchParams.set('limit', String(PAGE_LIMIT));
  url.searchParams.set('offset', String(Math.max(0, offset)));
  url.searchParams.set('fields', MAL_FIELDS);

  const payload = await cachedExternalFetch<MalRankingResponse>({
    apiName: `mal-ranking-${category}-offset-${offset}`,
    endpoint: url.toString(),
    ttlSeconds: EXTERNAL_API_REVALIDATE_SECONDS,
    init: {
      headers: {
        Accept: 'application/json',
        'X-MAL-CLIENT-ID': clientId,
      },
    },
  });

  return (payload.data ?? [])
    .map(item => item.node)
    .filter((node): node is MalNode => Boolean(node && typeof node.id === 'number'));
}

function getSeasonYear(dateString: string | null | undefined): number | null {
  if (!dateString) {
    return null;
  }
  const year = Number.parseInt(dateString.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

function buildMediaRow(category: MalCategory, node: MalNode): Record<string, unknown> {
  const titleEnglish = node.alternative_titles?.en ?? null;
  const titleNative = node.alternative_titles?.ja ?? null;
  return {
    category,
    source: 'mal',
    mal_id: node.id,
    title_english: titleEnglish,
    title_romaji: node.title ?? null,
    title_native: titleNative,
    description: node.synopsis ?? null,
    format: node.media_type ?? null,
    status: node.status ?? null,
    season_year: getSeasonYear(node.start_date),
    episodes: category === 'anime' ? (node.num_episodes ?? null) : null,
    chapters: category === 'manga' ? (node.num_chapters ?? null) : null,
    volumes: category === 'manga' ? (node.num_volumes ?? null) : null,
    start_date: node.start_date ?? null,
    end_date: node.end_date ?? null,
    rating: node.mean ?? null,
    cover_image_large: node.main_picture?.large ?? null,
    cover_image_medium: node.main_picture?.medium ?? null,
    genres: node.genres?.map(item => item.name).filter(Boolean) ?? [],
    tags: node.alternative_titles?.synonyms ?? [],
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

    const body = (await req.json().catch(() => null)) as
      | {
          category?: MalCategory;
          count?: number;
          maxPages?: number;
        }
      | null;

    const category: MalCategory = body?.category === 'manga' ? 'manga' : 'anime';
    const targetCount = Math.min(
      Math.max(toPositiveInt(body?.count, DEFAULT_COUNT), 1),
      MAX_COUNT,
    );
    const maxPages = Math.max(toPositiveInt(body?.maxPages, DEFAULT_MAX_SCAN_PAGES), 1);

    const clientId = getMalClientId();
    if (!clientId) {
      return fail(
        {
          error: 'Missing MAL_CLIENT_ID in server environment.',
          code: 'MAL_CLIENT_ID_MISSING',
        },
        500,
      );
    }

    const startOffset = await loadImportCursor(admin, category);
    let currentOffset = startOffset;
    let pagesScanned = 0;
    let inserted = 0;
    let skippedExisting = 0;
    let failed = 0;
    const seenIds = new Set<number>();

    while (inserted < targetCount && pagesScanned < maxPages) {
      const nodes = await fetchRankingPage(category, clientId, currentOffset);
      pagesScanned += 1;

      if (nodes.length === 0) {
        currentOffset = 0;
        break;
      }

      const candidateIds = nodes
        .map(node => node.id)
        .filter(id => !seenIds.has(id))
        .filter((id, index, arr) => arr.indexOf(id) === index);

      if (candidateIds.length === 0) {
        currentOffset += PAGE_LIMIT;
        continue;
      }

      candidateIds.forEach(id => seenIds.add(id));

      const { data: existingRows, error: existingError } = await admin
        .from('media_items')
        .select('mal_id')
        .eq('category', category)
        .in('mal_id', candidateIds);

      if (existingError) {
        console.error('[Admin MAL Import] Existing IDs query error:', existingError);
        return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
      }

      const existingIds = new Set(
        (existingRows ?? [])
          .map(row => row.mal_id)
          .filter((value): value is number => typeof value === 'number' && Number.isFinite(value)),
      );

      skippedExisting += existingIds.size;

      const idToNode = new Map<number, MalNode>(nodes.map(node => [node.id, node]));
      const newIds = candidateIds.filter(id => !existingIds.has(id));

      for (const id of newIds) {
        const node = idToNode.get(id);
        if (!node) {
          continue;
        }

        const result = await insertMediaRow(admin, buildMediaRow(category, node));
        if (result === 'inserted') {
          inserted += 1;
          if (inserted >= targetCount) {
            break;
          }
        } else if (result === 'duplicate') {
          skippedExisting += 1;
        } else {
          failed += 1;
          console.error('[Admin MAL Import] Insert failed for row:', { category, malId: id });
        }
      }

      currentOffset += PAGE_LIMIT;
    }

    await saveImportCursor(admin, category, currentOffset);

    return ok({
      category,
      requested: targetCount,
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
    console.error('[Admin MAL Import] Error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const POST = withApiRoute(POSTHandler);
