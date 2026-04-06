import 'whatwg-fetch';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

const createRouteHandlerClientMock = jest.fn();
const createSupabaseAdminClientMock = jest.fn();
const requireAdminRoleMock = jest.fn();
const igdbPostMock = jest.fn();
const getIgdbAccessTokenMock = jest.fn();
const getIgdbClientIdMock = jest.fn();
const mapIgdbToPayloadMock = jest.fn();
const searchIgdbGamesMock = jest.fn();
const searchIgdbGamesWithoutCategoryFilterMock = jest.fn();
const igdbAllowedCategoriesWhereClauseMock = jest.fn();
const isAllowedIgdbGameCandidateMock = jest.fn();
const getIgdbCategoryLabelMock = jest.fn();

jest.mock('@/lib/supabase-route-handler', () => ({
  createRouteHandlerClient: () => createRouteHandlerClientMock(),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => createSupabaseAdminClientMock(),
}));

jest.mock('@/lib/api/permissions', () => ({
  ForbiddenError: class ForbiddenError extends Error {
    code = 'FORBIDDEN';
  },
  requireAdminRole: (...args: unknown[]) => requireAdminRoleMock(...args),
}));

jest.mock('@/lib/api/auth', () => ({
  UnauthorizedError: class UnauthorizedError extends Error {
    code = 'UNAUTHORIZED';
  },
}));

jest.mock('@/lib/igdb/igdbClient', () => ({
  igdbPost: (...args: unknown[]) => igdbPostMock(...args),
}));

jest.mock('@/lib/igdb/token', () => ({
  getIgdbAccessToken: () => getIgdbAccessTokenMock(),
  getIgdbClientId: () => getIgdbClientIdMock(),
}));

jest.mock('@/lib/services/igdbService', () => ({
  mapIgdbToPayload: (...args: unknown[]) => mapIgdbToPayloadMock(...args),
  searchIgdbGames: (...args: unknown[]) => searchIgdbGamesMock(...args),
  searchIgdbGamesWithoutCategoryFilter: (...args: unknown[]) =>
    searchIgdbGamesWithoutCategoryFilterMock(...args),
}));

jest.mock('@/lib/igdb/categories', () => ({
  igdbAllowedCategoriesWhereClause: () => igdbAllowedCategoriesWhereClauseMock(),
  isAllowedIgdbGameCandidate: (...args: unknown[]) => isAllowedIgdbGameCandidateMock(...args),
  getIgdbCategoryLabel: (...args: unknown[]) => getIgdbCategoryLabelMock(...args),
}));

import { API_ERRORS } from '@/lib/api/errors';
import { UnauthorizedError } from '@/lib/api/auth';
import { ForbiddenError } from '@/lib/api/permissions';
import { POST, runtime, dynamic, maxDuration } from '@/app/api/admin/media/import/igdb/route';

type ExistingResult = { data: Array<{ igdb_id: unknown }> | null; error: unknown };

function makeAdminMock(config?: {
  importCursorRaw?: unknown;
  importCursorError?: unknown;
  seedCursorRaw?: unknown;
  seedCursorError?: unknown;
  upsertErrorByKey?: Record<string, unknown>;
  existingQueue?: ExistingResult[];
  insertBehavior?: Record<string, 'ok' | 'duplicate' | 'failed' | 'failed-string'>;
}) {
  const existingQueue = [...(config?.existingQueue ?? [{ data: [], error: null }])];
  const insertBehavior = config?.insertBehavior ?? {};
  const upserts: Array<Record<string, unknown>> = [];
  const insertedRows: Array<Record<string, unknown>> = [];

  const apiCacheMaybeSingle = jest.fn().mockImplementation((key: string) => {
    if (key === 'admin-igdb-import-cursor:games') {
      return Promise.resolve({
        data: { data: { nextOffset: config?.importCursorRaw } },
        error: config?.importCursorError ?? null,
      });
    }
    if (key === 'admin-igdb-import-seed-cursor:games') {
      return Promise.resolve({
        data: { data: { nextIndex: config?.seedCursorRaw } },
        error: config?.seedCursorError ?? null,
      });
    }
    return Promise.resolve({ data: null, error: null });
  });

  const apiCacheEq = jest.fn().mockImplementation((_col: string, key: string) => ({
    maybeSingle: () => apiCacheMaybeSingle(key),
  }));
  const apiCacheSelect = jest.fn().mockReturnValue({ eq: apiCacheEq });
  const apiCacheUpsert = jest.fn().mockImplementation((payload: Record<string, unknown>) => {
    upserts.push(payload);
    const key = String(payload.key ?? '');
    const error = config?.upsertErrorByKey?.[key] ?? null;
    return Promise.resolve({ error });
  });

  const mediaExistingIn = jest.fn().mockImplementation(() => {
    const next = existingQueue.shift() ?? { data: [], error: null };
    return Promise.resolve(next);
  });
  const mediaExistingEq = jest.fn().mockReturnValue({ in: mediaExistingIn });
  const mediaSelect = jest.fn().mockReturnValue({ eq: mediaExistingEq });

  const mediaInsert = jest.fn().mockImplementation((row: Record<string, unknown>) => {
    insertedRows.push(row);
    const id = String(row.igdb_id ?? '');
    const behavior = insertBehavior[id] ?? 'ok';
    if (behavior === 'duplicate') {
      return Promise.resolve({ error: { code: '23505' } });
    }
    if (behavior === 'failed') {
      return Promise.resolve({ error: { code: 'XX000' } });
    }
    if (behavior === 'failed-string') {
      return Promise.resolve({ error: 'insert-failed' });
    }
    return Promise.resolve({ error: null });
  });

  const from = jest.fn().mockImplementation((table: string) => {
    if (table === 'api_cache') {
      return { select: apiCacheSelect, upsert: apiCacheUpsert };
    }
    if (table === 'media_items') {
      return { select: mediaSelect, insert: mediaInsert };
    }
    return {};
  });

  return {
    client: { from },
    spies: {
      upserts,
      insertedRows,
      mediaInsert,
      mediaExistingIn,
      apiCacheUpsert,
    },
  };
}

describe('app/api/admin/media/import/igdb/route', () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    createRouteHandlerClientMock.mockResolvedValue({ auth: {} });
    requireAdminRoleMock.mockResolvedValue({});
    getIgdbAccessTokenMock.mockResolvedValue('token-1');
    getIgdbClientIdMock.mockReturnValue('client-1');
    igdbAllowedCategoriesWhereClauseMock.mockReturnValue('0,8,9');
    mapIgdbToPayloadMock.mockImplementation((game: { id: number }) => ({
      igdb_id: game.id,
      category: 'games',
      title: `Game ${game.id}`,
    }));
    isAllowedIgdbGameCandidateMock.mockImplementation(
      (input: { name?: string }) => !String(input.name ?? '').includes('unsupported'),
    );
    getIgdbCategoryLabelMock.mockImplementation((category: number | null | undefined) =>
      category == null ? 'Unknown' : `Category ${category}`,
    );
    searchIgdbGamesMock.mockResolvedValue([]);
    searchIgdbGamesWithoutCategoryFilterMock.mockResolvedValue([]);
    (global.fetch as unknown as jest.Mock) = jest.fn();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('exports route metadata', () => {
    expect(runtime).toBe('nodejs');
    expect(dynamic).toBe('force-dynamic');
    expect(maxDuration).toBe(60);
  });

  it('imports from cached igdb pages and reports inserted/duplicate/failed/unsupported', async () => {
    const admin = makeAdminMock({
      importCursorRaw: 100,
      existingQueue: [{ data: [{ igdb_id: 10 }], error: null }],
      insertBehavior: {
        '12': 'duplicate',
        '13': 'failed',
      },
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);

    igdbPostMock.mockResolvedValue([
      { id: 10, name: 'existing' },
      { id: 11, name: 'supported-one' },
      { id: 12, name: 'supported-dup' },
      { id: 13, name: 'supported-fail' },
      { id: 14, name: 'unsupported-game', category: 99 },
      { id: -1, name: 'bad-id' },
      { id: 11, name: 'duplicate-id-in-page' },
    ]);

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 99, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      category: 'games',
      requested: 99,
      fetchedCandidates: 5,
      inserted: 1,
      skippedExisting: 2,
      skippedUnsupported: 1,
      failed: 1,
      pagesScanned: 1,
      startOffset: 100,
      nextCursorOffset: 200,
      reachedTarget: false,
    });
    expect(admin.spies.insertedRows.map(r => r.igdb_id)).toEqual([11, 12, 13]);
    expect(admin.spies.upserts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'admin-igdb-import-cursor:games',
          data: { nextOffset: 200 },
        }),
      ]),
    );
  });

  it('uses uncached IGDB HTTP fallback when cached queries are empty', async () => {
    const admin = makeAdminMock({
      importCursorRaw: 0,
      existingQueue: [{ data: [], error: null }],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);

    igdbPostMock.mockResolvedValue([]);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [{ id: 201, name: 'uncached-game' }],
    });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 1, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.inserted).toBe(1);
    expect(igdbPostMock).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('returns internal when existing IDs query fails in primary flow', async () => {
    const admin = makeAdminMock({
      existingQueue: [{ data: null, error: { message: 'existing failed' } }],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    igdbPostMock.mockResolvedValue([{ id: 1, name: 'a' }]);

    const response = await POST(
      new Request('https://example.com', { method: 'POST', body: JSON.stringify({}) }),
    );
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('falls back to seeded search import when listing yields no candidates', async () => {
    const admin = makeAdminMock({
      importCursorRaw: 9,
      seedCursorRaw: 14, // 14 % 12 = 2
      existingQueue: [{ data: [], error: null }],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    igdbPostMock.mockResolvedValue([]);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    searchIgdbGamesMock.mockResolvedValue([]);
    searchIgdbGamesWithoutCategoryFilterMock.mockResolvedValue([
      { id: 501, name: 'seed-supported', category: 0, slug: 'seed-supported' },
      { id: 502, name: 'seed-unsupported', category: 99, slug: 'seed-unsupported' },
    ]);
    isAllowedIgdbGameCandidateMock.mockImplementation(
      (input: { name?: string }) => !String(input.name ?? '').includes('unsupported'),
    );

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 1, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      inserted: 1,
      fetchedCandidates: 1,
      startOffset: 9,
    });
    expect(searchIgdbGamesMock).toHaveBeenCalledWith('rpg', 20);
    expect(searchIgdbGamesWithoutCategoryFilterMock).toHaveBeenCalledWith('rpg', 40);
    expect(admin.spies.upserts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'admin-igdb-import-seed-cursor:games',
          data: { nextIndex: 3 },
        }),
        expect.objectContaining({
          key: 'admin-igdb-import-cursor:games',
        }),
      ]),
    );
  });

  it('returns internal when seed fallback existing IDs query fails', async () => {
    const admin = makeAdminMock({
      existingQueue: [{ data: null, error: { message: 'seed existing fail' } }],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);

    igdbPostMock.mockResolvedValue([]);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    searchIgdbGamesMock.mockResolvedValue([{ id: 700, name: 'seed' }]);

    const response = await POST(
      new Request('https://example.com', { method: 'POST', body: JSON.stringify({ maxPages: 1 }) }),
    );
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('returns 502 when both listing and seed fallback produce zero candidates', async () => {
    const admin = makeAdminMock({ importCursorRaw: 123, seedCursorRaw: -1 });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);

    igdbPostMock.mockResolvedValue([]);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    searchIgdbGamesMock.mockResolvedValue([]);
    searchIgdbGamesWithoutCategoryFilterMock.mockResolvedValue([]);

    const response = await POST(
      new Request('https://example.com', { method: 'POST', body: JSON.stringify({ count: 1 }) }),
    );
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error:
        'IGDB returned no candidate games for the current import window. Check IGDB connectivity/credentials and try again.',
      code: 'IGDB_NO_CANDIDATES',
    });
  });

  it('maps unauthorized/forbidden and unexpected errors', async () => {
    createSupabaseAdminClientMock.mockReturnValue(makeAdminMock().client);

    requireAdminRoleMock.mockRejectedValueOnce(new UnauthorizedError());
    const r1 = await POST(new Request('https://example.com', { method: 'POST' }));
    expect(r1.status).toBe(API_ERRORS.UNAUTHORIZED.status);

    requireAdminRoleMock.mockRejectedValueOnce(new ForbiddenError());
    const r2 = await POST(new Request('https://example.com', { method: 'POST' }));
    expect(r2.status).toBe(API_ERRORS.FORBIDDEN.status);

    igdbPostMock.mockRejectedValueOnce(new Error('unexpected'));
    const r3 = await POST(new Request('https://example.com', { method: 'POST' }));
    expect(r3.status).toBe(API_ERRORS.INTERNAL.status);
  });

  it('returns internal when uncached IGDB request fails or cached response shape is invalid', async () => {
    createSupabaseAdminClientMock.mockReturnValue(makeAdminMock().client);

    igdbPostMock.mockResolvedValueOnce({ not: 'array' });
    const r1 = await POST(new Request('https://example.com', { method: 'POST' }));
    expect(r1.status).toBe(API_ERRORS.INTERNAL.status);

    jest.clearAllMocks();
    createRouteHandlerClientMock.mockResolvedValue({ auth: {} });
    requireAdminRoleMock.mockResolvedValue({});
    createSupabaseAdminClientMock.mockReturnValue(makeAdminMock().client);
    igdbPostMock.mockResolvedValue([]);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'fail',
    });

    const r2 = await POST(new Request('https://example.com', { method: 'POST' }));
    expect(r2.status).toBe(API_ERRORS.INTERNAL.status);
  });

  it('logs warnings when loading cursors fails and when saving seed cursor fails', async () => {
    const admin = makeAdminMock({
      importCursorError: { message: 'import cursor fail' },
      seedCursorError: { message: 'seed cursor fail' },
      upsertErrorByKey: { 'admin-igdb-import-seed-cursor:games': { message: 'seed save fail' } },
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);

    igdbPostMock.mockResolvedValue([]);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [] });
    searchIgdbGamesMock.mockResolvedValue([]);
    searchIgdbGamesWithoutCategoryFilterMock.mockResolvedValue([]);

    const response = await POST(
      new Request('https://example.com', { method: 'POST', body: JSON.stringify({ count: 1 }) }),
    );

    expect(response.status).toBe(502);
    expect(warnSpy).toHaveBeenCalledWith(
      '[Admin IGDB Import] Failed to load cursor:',
      'import cursor fail',
    );
    expect(warnSpy).toHaveBeenCalledWith(
      '[Admin IGDB Import] Failed to load seed cursor:',
      'seed cursor fail',
    );
    expect(warnSpy).toHaveBeenCalledWith(
      '[Admin IGDB Import] Failed to save seed cursor:',
      'seed save fail',
    );
  });

  it('logs warning when saving import cursor fails after successful import', async () => {
    const admin = makeAdminMock({
      existingQueue: [{ data: [], error: null }],
      upsertErrorByKey: { 'admin-igdb-import-cursor:games': { message: 'import save fail' } },
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    igdbPostMock.mockResolvedValue([{ id: 901, name: 'ok-game', category: 0, slug: 'ok' }]);

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 1, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    expect(warnSpy).toHaveBeenCalledWith(
      '[Admin IGDB Import] Failed to save cursor:',
      'import save fail',
    );
  });

  it('handles uncached IGDB success with invalid JSON shape as internal error', async () => {
    createSupabaseAdminClientMock.mockReturnValue(makeAdminMock().client);
    igdbPostMock.mockResolvedValue([]);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ not: 'array' }),
    });

    const response = await POST(new Request('https://example.com', { method: 'POST' }));
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
  });

  it('covers candidateIds-empty branch in primary loop', async () => {
    const admin = makeAdminMock({
      importCursorRaw: 50000,
      existingQueue: [{ data: [], error: null }],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    igdbPostMock
      .mockResolvedValueOnce([{ id: 1001, name: 'first', category: 0, slug: 'first' }])
      .mockResolvedValueOnce([{ id: 1001, name: 'same-id', category: 0, slug: 'same-id' }]);

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 2, maxPages: 2 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.pagesScanned).toBe(2);
    expect(body.data.nextCursorOffset).toBe(100);
  });

  it('covers candidateIds-empty branch at MAX offset in primary loop', async () => {
    const admin = makeAdminMock({
      importCursorRaw: 50000,
      existingQueue: [],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    igdbPostMock.mockResolvedValue([{ id: -5, name: 'invalid-id' }]);

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 1, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(502);
    expect((await response.json()).code).toBe('IGDB_NO_CANDIDATES');
  });

  it('covers fallback unsupported/duplicate/failed paths and empty candidateIds continue', async () => {
    const admin = makeAdminMock({
      existingQueue: [
        { data: [], error: null },
        { data: [], error: null },
      ],
      insertBehavior: { '1202': 'duplicate', '1203': 'failed-string' },
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    igdbPostMock.mockResolvedValue([]);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [] });

    searchIgdbGamesMock
      .mockResolvedValueOnce([
        { id: 1201, name: 'unsupported-strict', category: 99 },
        { id: 1202, name: 'dup-strict', category: 0 },
        { id: 1203, name: 'fail-strict', category: 0 },
      ])
      .mockResolvedValueOnce([{ id: 1202, name: 'dup-seen-again', category: 0 }]);
    isAllowedIgdbGameCandidateMock.mockImplementation(
      (input: { name?: string }) => !String(input.name ?? '').includes('unsupported'),
    );

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 2, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.skippedUnsupported).toBeGreaterThanOrEqual(1);
    expect(body.data.skippedExisting).toBeGreaterThanOrEqual(1);
    expect(body.data.failed).toBeGreaterThanOrEqual(1);
    expect(getIgdbCategoryLabelMock).toHaveBeenCalled();
  });

  it('handles null existingRows in primary and seed fallback queries', async () => {
    const admin = makeAdminMock({
      existingQueue: [
        { data: null, error: null },
        { data: null, error: null },
      ],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);

    igdbPostMock
      .mockResolvedValueOnce([{ id: 1401, name: 'main-insert', category: 0 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [] });

    searchIgdbGamesMock.mockResolvedValueOnce([{ id: 1402, name: 'seed-insert', category: 0 }]);

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 2, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.inserted).toBe(1);
    expect(body.data.skippedExisting).toBe(0);
  });

  it('handles null existingRows during seed fallback success path', async () => {
    const admin = makeAdminMock({
      existingQueue: [{ data: null, error: null }],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);

    igdbPostMock.mockResolvedValue([]);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [] });
    searchIgdbGamesMock.mockResolvedValue([{ id: 1451, name: 'seed-null-existing', category: 0 }]);

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 1, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.inserted).toBe(1);
    expect(body.data.skippedExisting).toBe(0);
  });

  it('covers seed fallback slug normalization and mixed existing id filtering branches', async () => {
    searchIgdbGamesMock.mockReset();
    searchIgdbGamesWithoutCategoryFilterMock.mockReset();
    isAllowedIgdbGameCandidateMock.mockReset();
    igdbPostMock.mockReset();

    const admin = makeAdminMock({
      existingQueue: [
        { data: [{ igdb_id: 1502 }, { igdb_id: Number.NaN }, { igdb_id: 'bad-id' }], error: null },
      ],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);

    igdbPostMock.mockResolvedValue([]);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [] });
    searchIgdbGamesMock.mockResolvedValue([]);
    searchIgdbGamesWithoutCategoryFilterMock.mockResolvedValue([
      { id: 1501, name: 'seed-no-slug', category: 0 },
      { id: 1502, name: 'seed-existing', category: 0, slug: 'seed-existing' },
    ]);
    isAllowedIgdbGameCandidateMock.mockImplementation(() => true);

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 1, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.inserted).toBe(1);
    expect(body.data.skippedExisting).toBe(1);
    expect(body.data.fetchedCandidates).toBe(2);
    expect(isAllowedIgdbGameCandidateMock).toHaveBeenCalledWith(
      expect.objectContaining({ slug: null }),
    );
    expect(isAllowedIgdbGameCandidateMock).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'seed-existing' }),
    );
  });
});
