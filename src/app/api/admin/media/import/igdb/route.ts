import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { UnauthorizedError } from '@/lib/api/auth';
import { ForbiddenError, requireAdminRole } from '@/lib/api/permissions';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import { NextResponse } from 'next/server';
import { igdbPost } from '@/lib/igdb/igdbClient';
import { getIgdbAccessToken, getIgdbClientId } from '@/lib/igdb/token';
import {
  mapIgdbToPayload,
  searchIgdbGames,
  searchIgdbGamesWithoutCategoryFilter,
  type IgdbGame,
} from '@/lib/services/igdbService';
import {
  igdbAllowedCategoriesWhereClause,
  isAllowedIgdbGameCandidate,
  getIgdbCategoryLabel,
} from '@/lib/igdb/categories';

const DEFAULT_COUNT = 200;
const MAX_COUNT = 500;
const PAGE_LIMIT = 100;
const DEFAULT_MAX_SCAN_PAGES = 120;
const MAX_OFFSET = 50000;
const CURSOR_TTL_SECONDS = 10 * 365 * 24 * 60 * 60;
const IGDB_SEED_TERMS = [
  'action',
  'adventure',
  'rpg',
  'strategy',
  'simulation',
  'indie',
  'horror',
  'racing',
  'platformer',
  'shooter',
  'puzzle',
  'sports',
] as const;

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getCursorKey(): string {
  return 'admin-igdb-import-cursor:games';
}

function getSeedCursorKey(): string {
  return 'admin-igdb-import-seed-cursor:games';
}

function isDuplicateKeyError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  return (error as { code?: string }).code === '23505';
}

async function loadImportCursor(admin: ReturnType<typeof createSupabaseAdminClient>): Promise<number> {
  const { data, error } = await admin
    .from('api_cache')
    .select('data')
    .eq('key', getCursorKey())
    .maybeSingle();

  if (error) {
    console.warn('[Admin IGDB Import] Failed to load cursor:', error.message);
    return 0;
  }

  const raw = (data?.data as { nextOffset?: unknown } | null)?.nextOffset;
  const nextOffset = Number.parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(nextOffset) || nextOffset < 0 || nextOffset > MAX_OFFSET) {
    return 0;
  }
  return nextOffset;
}

async function loadSeedCursor(admin: ReturnType<typeof createSupabaseAdminClient>): Promise<number> {
  const { data, error } = await admin
    .from('api_cache')
    .select('data')
    .eq('key', getSeedCursorKey())
    .maybeSingle();

  if (error) {
    console.warn('[Admin IGDB Import] Failed to load seed cursor:', error.message);
    return 0;
  }

  const raw = (data?.data as { nextIndex?: unknown } | null)?.nextIndex;
  const nextIndex = Number.parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(nextIndex) || nextIndex < 0) {
    return 0;
  }
  return nextIndex % IGDB_SEED_TERMS.length;
}

async function saveImportCursor(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  nextOffset: number,
): Promise<void> {
  const normalized =
    Number.isFinite(nextOffset) && nextOffset >= 0 && nextOffset <= MAX_OFFSET ? nextOffset : 0;
  const expiresAt = new Date(Date.now() + CURSOR_TTL_SECONDS * 1000).toISOString();

  const { error } = await admin.from('api_cache').upsert({
    key: getCursorKey(),
    data: { nextOffset: normalized },
    expires_at: expiresAt,
  });

  if (error) {
    console.warn('[Admin IGDB Import] Failed to save cursor:', error.message);
  }
}

async function saveSeedCursor(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  nextIndex: number,
): Promise<void> {
  const normalized = Number.isFinite(nextIndex) && nextIndex >= 0 ? nextIndex : 0;
  const expiresAt = new Date(Date.now() + CURSOR_TTL_SECONDS * 1000).toISOString();

  const { error } = await admin.from('api_cache').upsert({
    key: getSeedCursorKey(),
    data: { nextIndex: normalized % IGDB_SEED_TERMS.length },
    expires_at: expiresAt,
  });

  if (error) {
    console.warn('[Admin IGDB Import] Failed to save seed cursor:', error.message);
  }
}

async function fetchIgdbPage(offset: number): Promise<IgdbGame[]> {
  const queryBodies = [
    `
fields id,name,category,parent_game,version_parent,slug,summary,storyline,first_release_date,updated_at,cover.image_id,artworks.image_id,screenshots.image_id,platforms.name,genres.name,themes.name,game_modes.name,player_perspectives.name,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,aggregated_rating,aggregated_rating_count,rating,rating_count,websites.url,websites.category;
where category = ${igdbAllowedCategoriesWhereClause()} & version_parent = null;
sort first_release_date desc;
limit ${PAGE_LIMIT};
offset ${Math.max(0, offset)};
`,
    `
fields id,name,category,parent_game,version_parent,slug,summary,storyline,first_release_date,updated_at,cover.image_id,artworks.image_id,screenshots.image_id,platforms.name,genres.name,themes.name,game_modes.name,player_perspectives.name,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,aggregated_rating,aggregated_rating_count,rating,rating_count,websites.url,websites.category;
where category = ${igdbAllowedCategoriesWhereClause()};
sort total_rating_count desc;
limit ${PAGE_LIMIT};
offset ${Math.max(0, offset)};
`,
    `
fields id,name,category,parent_game,version_parent,slug,summary,storyline,first_release_date,updated_at,cover.image_id,artworks.image_id,screenshots.image_id,platforms.name,genres.name,themes.name,game_modes.name,player_perspectives.name,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,aggregated_rating,aggregated_rating_count,rating,rating_count,websites.url,websites.category;
where category = ${igdbAllowedCategoriesWhereClause()};
sort id desc;
limit ${PAGE_LIMIT};
offset ${Math.max(0, offset)};
`,
  ];

  const runCachedQuery = async (body: string): Promise<IgdbGame[]> => {
    const data = (await igdbPost('/games', body)) as unknown;
    if (!Array.isArray(data)) {
      throw new Error(
        `[Admin IGDB Import] Unexpected IGDB response shape: ${JSON.stringify(data).slice(0, 300)}`,
      );
    }
    return data as IgdbGame[];
  };

  const runUncachedQuery = async (body: string): Promise<IgdbGame[]> => {
    const token = await getIgdbAccessToken();
    const clientId = getIgdbClientId();
    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
        Accept: 'application/json',
      },
      body,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`[Admin IGDB Import] Uncached IGDB query failed: ${response.status} ${text}`);
    }
    const data = (await response.json()) as unknown;
    if (!Array.isArray(data)) {
      throw new Error(
        `[Admin IGDB Import] Unexpected uncached IGDB response shape: ${JSON.stringify(data).slice(0, 300)}`,
      );
    }
    return data as IgdbGame[];
  };

  for (const body of queryBodies) {
    const data = await runCachedQuery(body);
    if (data.length > 0) {
      return data;
    }
  }

  // If cache is stale-empty, retry same strategies uncached.
  for (const body of queryBodies) {
    const data = await runUncachedQuery(body);
    if (data.length > 0) {
      return data;
    }
  }

  return [];
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
      | { count?: number; maxPages?: number }
      | null;

    const targetCount = Math.min(
      Math.max(toPositiveInt(body?.count, DEFAULT_COUNT), 1),
      MAX_COUNT,
    );
    const maxPages = Math.max(toPositiveInt(body?.maxPages, DEFAULT_MAX_SCAN_PAGES), 1);

    const startOffset = await loadImportCursor(admin);
    let currentOffset = startOffset;
    let pagesScanned = 0;
    let inserted = 0;
    let skippedExisting = 0;
    let skippedUnsupported = 0;
    let failed = 0;
    let fetchedCandidates = 0;
    const seenIds = new Set<number>();

    while (inserted < targetCount && pagesScanned < maxPages) {
      const games = await fetchIgdbPage(currentOffset);
      pagesScanned += 1;

      if (games.length === 0) {
        currentOffset = 0;
        break;
      }

      const pageGames = games.filter(game => typeof game.id === 'number' && game.id > 0);
      const candidateIds = pageGames
        .map(game => game.id)
        .filter(id => !seenIds.has(id))
        .filter((id, index, arr) => arr.indexOf(id) === index);
      fetchedCandidates += candidateIds.length;

      if (candidateIds.length === 0) {
        currentOffset = currentOffset + PAGE_LIMIT > MAX_OFFSET ? 0 : currentOffset + PAGE_LIMIT;
        continue;
      }

      candidateIds.forEach(id => seenIds.add(id));

      const { data: existingRows, error: existingError } = await admin
        .from('media_items')
        .select('igdb_id')
        .eq('category', 'games')
        .in('igdb_id', candidateIds);

      if (existingError) {
        console.error('[Admin IGDB Import] Existing IDs query error:', existingError);
        return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
      }

      const existingIds = new Set(
        (existingRows ?? [])
          .map(row => row.igdb_id)
          .filter((value): value is number => typeof value === 'number' && Number.isFinite(value)),
      );
      skippedExisting += existingIds.size;

      const idToGame = new Map<number, IgdbGame>(pageGames.map(game => [game.id, game]));
      const newIds = candidateIds.filter(id => !existingIds.has(id));

      for (const id of newIds) {
        const game = idToGame.get(id);
        if (!game) {
          continue;
        }

        if (
          !isAllowedIgdbGameCandidate({
            category: game.category,
            name: game.name,
            slug: game.slug ?? null,
          })
        ) {
          skippedUnsupported += 1;
          continue;
        }

        const payload = mapIgdbToPayload(game);
        const result = await insertMediaRow(admin, payload as unknown as Record<string, unknown>);

        if (result === 'inserted') {
          inserted += 1;
          if (inserted >= targetCount) {
            break;
          }
        } else if (result === 'duplicate') {
          skippedExisting += 1;
        } else {
          failed += 1;
          console.error('[Admin IGDB Import] Insert failed for row:', {
            igdbId: id,
            category: getIgdbCategoryLabel(game.category),
          });
        }
      }

      currentOffset = currentOffset + PAGE_LIMIT > MAX_OFFSET ? 0 : currentOffset + PAGE_LIMIT;
    }

    // Fallback when IGDB listing returns empty: use working seeded search queries.
    if (fetchedCandidates === 0 && inserted < targetCount) {
      const seedStartIndex = await loadSeedCursor(admin);
      let seedSteps = 0;
      let seedIndex = seedStartIndex;
      const maxSeedSteps = IGDB_SEED_TERMS.length;

      while (inserted < targetCount && seedSteps < maxSeedSteps) {
        const term = IGDB_SEED_TERMS[seedIndex % IGDB_SEED_TERMS.length];
        let games = await searchIgdbGames(term, 20);
        if (games.length === 0) {
          games = (await searchIgdbGamesWithoutCategoryFilter(term, 40)).filter(game =>
            isAllowedIgdbGameCandidate({
              category: game.category,
              name: game.name,
              slug: game.slug ?? null,
            }),
          );
        }
        seedSteps += 1;
        seedIndex += 1;
        fetchedCandidates += games.length;

        if (games.length === 0) {
          continue;
        }

        const candidateIds = Array.from(
          new Set(
            games
              .map(game => game.id)
              .filter((id): id is number => typeof id === 'number' && id > 0)
              .filter(id => !seenIds.has(id)),
          ),
        );
        candidateIds.forEach(id => seenIds.add(id));

        if (candidateIds.length === 0) {
          continue;
        }

        const { data: existingRows, error: existingError } = await admin
          .from('media_items')
          .select('igdb_id')
          .eq('category', 'games')
          .in('igdb_id', candidateIds);

        if (existingError) {
          console.error('[Admin IGDB Import] Existing IDs query error (seed fallback):', existingError);
          return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
        }

        const existingIds = new Set(
          (existingRows ?? [])
            .map(row => row.igdb_id)
            .filter(
              (value): value is number => typeof value === 'number' && Number.isFinite(value),
            ),
        );
        skippedExisting += existingIds.size;

        const idToGame = new Map<number, IgdbGame>(games.map(game => [game.id, game]));
        const newIds = candidateIds.filter(id => !existingIds.has(id));

        for (const id of newIds) {
          const game = idToGame.get(id);
          if (!game) {
            continue;
          }

          if (
            !isAllowedIgdbGameCandidate({
              category: game.category,
              name: game.name,
              slug: game.slug ?? null,
            })
          ) {
            skippedUnsupported += 1;
            continue;
          }

          const payload = mapIgdbToPayload(game);
          const result = await insertMediaRow(admin, payload as unknown as Record<string, unknown>);

          if (result === 'inserted') {
            inserted += 1;
            if (inserted >= targetCount) {
              break;
            }
          } else if (result === 'duplicate') {
            skippedExisting += 1;
          } else {
            failed += 1;
            console.error('[Admin IGDB Import] Insert failed for row (seed fallback):', {
              igdbId: id,
              category: getIgdbCategoryLabel(game.category),
            });
          }
        }
      }

      await saveSeedCursor(admin, seedIndex);
    }

    if (fetchedCandidates === 0) {
      return NextResponse.json(
        {
          error:
            'IGDB returned no candidate games for the current import window. Check IGDB connectivity/credentials and try again.',
          code: 'IGDB_NO_CANDIDATES',
        },
        { status: 502 },
      );
    }

    await saveImportCursor(admin, currentOffset);

    return ok({
      category: 'games',
      requested: targetCount,
      fetchedCandidates,
      inserted,
      skippedExisting,
      skippedUnsupported,
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
    console.error('[Admin IGDB Import] Error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const POST = withApiRoute(POSTHandler);
