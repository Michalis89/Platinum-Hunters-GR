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
const cachedExternalFetchMock = jest.fn();

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

jest.mock('@/lib/api-cache/external', () => ({
  cachedExternalFetch: (...args: unknown[]) => cachedExternalFetchMock(...args),
}));

import { API_ERRORS } from '@/lib/api/errors';
import { UnauthorizedError } from '@/lib/api/auth';
import { ForbiddenError } from '@/lib/api/permissions';
import { POST, dynamic, maxDuration } from '@/app/api/admin/media/import/mal/route';

type ExistingResult = { data: Array<{ mal_id: unknown }> | null; error: unknown };

function makeAdminMock(config?: {
  cursorRaw?: unknown;
  cursorError?: unknown;
  upsertError?: unknown;
  existingQueue?: ExistingResult[];
  insertBehavior?: Record<string, 'ok' | 'duplicate' | 'failed' | 'failed-string'>;
}) {
  const existingQueue = [...(config?.existingQueue ?? [{ data: [], error: null }])];
  const insertBehavior = config?.insertBehavior ?? {};
  const upserts: Array<Record<string, unknown>> = [];
  const insertedRows: Array<Record<string, unknown>> = [];

  const apiCacheMaybeSingle = jest.fn().mockResolvedValue({
    data: { data: { nextOffset: config?.cursorRaw } },
    error: config?.cursorError ?? null,
  });
  const apiCacheEq = jest.fn().mockReturnValue({ maybeSingle: apiCacheMaybeSingle });
  const apiCacheSelect = jest.fn().mockReturnValue({ eq: apiCacheEq });
  const apiCacheUpsert = jest.fn().mockImplementation((payload: Record<string, unknown>) => {
    upserts.push(payload);
    return Promise.resolve({ error: config?.upsertError ?? null });
  });

  const mediaExistingIn = jest.fn().mockImplementation(() => {
    const next = existingQueue.shift() ?? { data: [], error: null };
    return Promise.resolve(next);
  });
  const mediaExistingEq = jest.fn().mockReturnValue({ in: mediaExistingIn });
  const mediaSelect = jest.fn().mockReturnValue({ eq: mediaExistingEq });

  const mediaInsert = jest.fn().mockImplementation((row: Record<string, unknown>) => {
    insertedRows.push(row);
    const id = String(row.mal_id ?? '');
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
    spies: { upserts, insertedRows, mediaInsert, mediaExistingIn, apiCacheUpsert },
  };
}

describe('app/api/admin/media/import/mal/route', () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MAL_CLIENT_ID = ' mal-client-id ';
    createRouteHandlerClientMock.mockResolvedValue({ auth: {} });
    requireAdminRoleMock.mockResolvedValue({});
    cachedExternalFetchMock.mockResolvedValue({ data: [] });
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('exports route metadata', () => {
    expect(dynamic).toBe('force-dynamic');
    expect(maxDuration).toBe(60);
  });

  it('returns 500 when MAL client id is missing', async () => {
    delete process.env.MAL_CLIENT_ID;
    createSupabaseAdminClientMock.mockReturnValue(makeAdminMock().client);

    const response = await POST(new Request('https://example.com', { method: 'POST' }));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Missing MAL_CLIENT_ID in server environment.',
      code: 'MAL_CLIENT_ID_MISSING',
    });
  });

  it('imports anime rows and covers duplicate/failed/existing/id-filter paths', async () => {
    const admin = makeAdminMock({
      cursorRaw: 300,
      existingQueue: [{ data: [{ mal_id: 2001 }], error: null }],
      insertBehavior: { '2003': 'duplicate', '2004': 'failed-string' },
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock.mockResolvedValue({
      data: [
        {
          node: { id: 2001, title: 'already-existing', num_episodes: 13, start_date: '2022-01-12' },
        },
        {
          node: {
            id: 2002,
            title: 'inserted-anime',
            synopsis: 'story',
            mean: 8.7,
            num_episodes: 24,
            media_type: 'tv',
            status: 'finished_airing',
            start_date: '2021-04-09',
            end_date: '2021-09-10',
            main_picture: { large: 'L', medium: 'M' },
            alternative_titles: { en: 'English Title', ja: 'Japanese Title', synonyms: ['Alt A'] },
            genres: [
              { id: 1, name: 'Action' },
              { id: 2, name: '' },
            ],
          },
        },
        { node: { id: 2003, title: 'duplicate-insert', num_episodes: 12 } },
        { node: { id: 2004, title: 'failed-insert', num_episodes: 10 } },
        { node: null },
        { node: { id: 'bad-id', title: 'invalid-id' } },
        { node: { id: 2001, title: 'duplicate-id-in-page' } },
      ],
    });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ category: 'anime', count: 99, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      category: 'anime',
      requested: 99,
      inserted: 1,
      skippedExisting: 2,
      failed: 1,
      pagesScanned: 1,
      startOffset: 300,
      nextCursorOffset: 400,
      reachedTarget: false,
    });
    expect(admin.spies.insertedRows.map(row => row.mal_id)).toEqual([2002, 2003, 2004]);
    expect(admin.spies.insertedRows[0]).toMatchObject({
      category: 'anime',
      source: 'mal',
      mal_id: 2002,
      title_english: 'English Title',
      title_romaji: 'inserted-anime',
      title_native: 'Japanese Title',
      season_year: 2021,
      episodes: 24,
      chapters: null,
      volumes: null,
      cover_image_large: 'L',
      cover_image_medium: 'M',
      genres: ['Action'],
      tags: ['Alt A'],
    });
    expect(admin.spies.upserts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'admin-mal-import-cursor:anime',
          data: { nextOffset: 400 },
        }),
      ]),
    );
  });

  it('imports manga rows and maps manga-only fields', async () => {
    const admin = makeAdminMock({
      existingQueue: [{ data: [], error: null }],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock.mockResolvedValue({
      data: [
        {
          node: {
            id: 2101,
            title: null,
            num_chapters: undefined,
            num_volumes: undefined,
            num_episodes: 999,
            start_date: 'bad-date',
            alternative_titles: { synonyms: null },
          },
        },
      ],
    });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ category: 'manga', count: 1, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    expect(admin.spies.insertedRows[0]).toMatchObject({
      category: 'manga',
      mal_id: 2101,
      episodes: null,
      chapters: null,
      volumes: null,
      season_year: null,
      tags: [],
      title_romaji: null,
    });
  });

  it('returns internal when existing IDs query fails', async () => {
    const admin = makeAdminMock({
      existingQueue: [{ data: null, error: { message: 'existing fail' } }],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock.mockResolvedValue({
      data: [{ node: { id: 2201, title: 'a' } }],
    });

    const response = await POST(new Request('https://example.com', { method: 'POST' }));
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('covers candidateIds-empty continue branch and reset-to-zero on empty page', async () => {
    const admin = makeAdminMock({
      cursorRaw: 500,
      existingQueue: [{ data: [], error: null }],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock
      .mockResolvedValueOnce({ data: [{ node: { id: 2301, title: 'first' } }] })
      .mockResolvedValueOnce({ data: [{ node: { id: 2301, title: 'duplicate-second-page' } }] })
      .mockResolvedValueOnce({ data: [] });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 3, maxPages: 3 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.pagesScanned).toBe(3);
    expect(body.data.nextCursorOffset).toBe(0);
  });

  it('logs warnings when loading or saving cursor fails', async () => {
    const admin = makeAdminMock({
      cursorError: { message: 'cursor load fail' },
      upsertError: { message: 'cursor save fail' },
      existingQueue: [{ data: [], error: null }],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock.mockResolvedValue({ data: [{ node: { id: 2401, title: 'ok' } }] });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 1, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    expect(warnSpy).toHaveBeenCalledWith(
      '[Admin MAL Import] Failed to load cursor:',
      'cursor load fail',
    );
    expect(warnSpy).toHaveBeenCalledWith(
      '[Admin MAL Import] Failed to save cursor:',
      'cursor save fail',
    );
  });

  it('maps unauthorized/forbidden and unexpected errors', async () => {
    createSupabaseAdminClientMock.mockReturnValue(makeAdminMock().client);

    requireAdminRoleMock.mockRejectedValueOnce(new UnauthorizedError());
    const r1 = await POST(new Request('https://example.com', { method: 'POST' }));
    expect(r1.status).toBe(API_ERRORS.UNAUTHORIZED.status);

    requireAdminRoleMock.mockRejectedValueOnce(new ForbiddenError());
    const r2 = await POST(new Request('https://example.com', { method: 'POST' }));
    expect(r2.status).toBe(API_ERRORS.FORBIDDEN.status);

    cachedExternalFetchMock.mockRejectedValueOnce(new Error('unexpected'));
    const r3 = await POST(new Request('https://example.com', { method: 'POST' }));
    expect(r3.status).toBe(API_ERRORS.INTERNAL.status);
  });

  it('covers cursor normalization and null existingRows branch', async () => {
    const admin = makeAdminMock({
      cursorRaw: -999,
      existingQueue: [{ data: null, error: null }],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock.mockResolvedValue({
      data: [{ node: { id: 2501, title: 'only-one' } }],
    });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 1, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.startOffset).toBe(0);
    expect(body.data.inserted).toBe(1);
    expect(body.data.skippedExisting).toBe(0);
  });

  it('handles ranking payload without data array', async () => {
    const admin = makeAdminMock();
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock.mockResolvedValue({});

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 1, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      inserted: 0,
      pagesScanned: 1,
      nextCursorOffset: 0,
    });
  });
});
