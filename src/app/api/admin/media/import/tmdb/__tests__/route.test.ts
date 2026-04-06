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
import { POST, dynamic, maxDuration } from '@/app/api/admin/media/import/tmdb/route';

type ExistingResult = { data: Array<{ tmdb_id: unknown }> | null; error: unknown };

function makeAdminMock(config?: {
  cursorRaw?: unknown;
  cursorError?: unknown;
  upsertError?: unknown;
  existingQueue?: ExistingResult[];
  insertBehavior?: Record<string, 'ok' | 'failed'>;
}) {
  const existingQueue = [...(config?.existingQueue ?? [{ data: [], error: null }])];
  const insertBehavior = config?.insertBehavior ?? {};
  const upserts: Array<Record<string, unknown>> = [];
  const insertedRows: Array<Record<string, unknown>> = [];

  const apiCacheMaybeSingle = jest.fn().mockResolvedValue({
    data: { data: { nextPage: config?.cursorRaw } },
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
    const id = String(row.tmdb_id ?? '');
    const behavior = insertBehavior[id] ?? 'ok';
    if (behavior === 'failed') {
      return Promise.resolve({ error: { code: 'XX000' } });
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

describe('app/api/admin/media/import/tmdb/route', () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TMDB_API_KEY = ' tmdb-key ';
    delete process.env.NEXT_PUBLIC_TMDB_API_KEY;
    createRouteHandlerClientMock.mockResolvedValue({ auth: {} });
    requireAdminRoleMock.mockResolvedValue({});
    cachedExternalFetchMock.mockResolvedValue({ results: [] });
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

  it('returns 500 when TMDB API key is missing', async () => {
    delete process.env.TMDB_API_KEY;
    delete process.env.NEXT_PUBLIC_TMDB_API_KEY;
    createSupabaseAdminClientMock.mockReturnValue(makeAdminMock().client);

    const response = await POST(new Request('https://example.com', { method: 'POST' }));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Missing TMDB API key in server environment.',
      code: 'TMDB_API_KEY_MISSING',
    });
  });

  it('imports movies and covers existing/failed/detail-failure paths', async () => {
    const admin = makeAdminMock({
      cursorRaw: 5,
      existingQueue: [{ data: [{ tmdb_id: 3001 }, { tmdb_id: 'bad' }], error: null }],
      insertBehavior: { '3003': 'failed' },
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);

    cachedExternalFetchMock.mockImplementation((input: { apiName: string }) => {
      if (input.apiName === 'tmdb-popular-movies-page-5') {
        return Promise.resolve({
          results: [
            {
              id: 3001,
              title: 'existing',
              overview: 'overview',
              poster_path: '/p-existing.jpg',
              backdrop_path: '/b-existing.jpg',
            },
            {
              id: 3002,
              title: 'inserted',
              original_title: 'inserted-original',
              overview: 'movie overview',
              release_date: '2024-01-02',
              vote_average: 7.3,
              vote_count: 100,
              popularity: 55,
              poster_path: '/p1.jpg',
              backdrop_path: '/b1.jpg',
            },
            { id: 3003, name: 'failed-persist' },
            { id: 3004, name: 'detail-fails' },
            { id: -1, title: 'invalid-id' },
          ],
        });
      }
      if (input.apiName === 'tmdb-details-movies-3002') {
        return Promise.resolve({
          runtime: 120,
          genres: [
            { id: 1, name: 'Drama' },
            { id: 2, name: '' },
          ],
          poster_path: null,
          backdrop_path: null,
        });
      }
      if (input.apiName === 'tmdb-details-movies-3003') {
        return Promise.resolve({
          runtime: 90,
          genres: [{ id: 5, name: 'Thriller' }],
        });
      }
      if (input.apiName === 'tmdb-details-movies-3004') {
        return Promise.reject(new Error('detail fetch failed'));
      }
      return Promise.resolve({ results: [] });
    });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ category: 'movies', count: 99, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      category: 'movies',
      requested: 99,
      inserted: 1,
      skippedExisting: 1,
      failed: 2,
      pagesScanned: 1,
      startPage: 5,
      nextCursorPage: 6,
      reachedTarget: false,
    });
    expect(admin.spies.insertedRows).toHaveLength(2);
    expect(admin.spies.insertedRows[0]).toMatchObject({
      category: 'movies',
      source: 'tmdb',
      tmdb_id: 3002,
      title: 'inserted',
      original_title: 'inserted-original',
      runtime: 120,
      number_of_seasons: null,
      number_of_episodes: null,
      cover_image_large: 'https://image.tmdb.org/t/p/w780/p1.jpg',
      cover_image_medium: 'https://image.tmdb.org/t/p/w342/p1.jpg',
      banner_image: 'https://image.tmdb.org/t/p/w1280/b1.jpg',
      genres: ['Drama'],
      status: 'published',
    });
    expect(errorSpy).toHaveBeenCalledWith(
      '[Admin TMDB Import] Failed to fetch details for movies:3004',
      expect.any(Error),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      '[Admin TMDB Import] Persist error for row:',
      expect.objectContaining({ category: 'movies', tmdbId: 3003 }),
    );
    expect(admin.spies.upserts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'admin-tmdb-import-cursor:movies',
          data: { nextPage: 6 },
        }),
      ]),
    );
  });

  it('imports tv and maps episode runtime fallback', async () => {
    const admin = makeAdminMock({ existingQueue: [{ data: [], error: null }] });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock.mockImplementation((input: { apiName: string }) => {
      if (input.apiName === 'tmdb-popular-tv-page-1') {
        return Promise.resolve({
          results: [{ id: 3101, name: 'tv-title', first_air_date: '2022-01-01' }],
        });
      }
      if (input.apiName === 'tmdb-details-tv-3101') {
        return Promise.resolve({
          runtime: null,
          episode_run_time: [48],
          number_of_seasons: 3,
          number_of_episodes: 30,
          genres: [{ id: 9, name: 'Sci-Fi' }],
          poster_path: '/tv-p.jpg',
          backdrop_path: '/tv-b.jpg',
        });
      }
      return Promise.resolve({ results: [] });
    });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ category: 'tv', count: 1, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    expect(admin.spies.insertedRows[0]).toMatchObject({
      category: 'tv',
      tmdb_id: 3101,
      title: 'tv-title',
      runtime: 48,
      number_of_seasons: 3,
      number_of_episodes: 30,
      release_date: null,
      first_air_date: '2022-01-01',
    });
  });

  it('maps tv runtime to null when episode runtime array is empty', async () => {
    const admin = makeAdminMock({ existingQueue: [{ data: [], error: null }] });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock.mockImplementation((input: { apiName: string }) => {
      if (input.apiName === 'tmdb-popular-tv-page-1') {
        return Promise.resolve({ results: [{ id: 3111, name: 'tv-no-runtime' }] });
      }
      if (input.apiName === 'tmdb-details-tv-3111') {
        return Promise.resolve({
          runtime: 99,
          episode_run_time: [],
          number_of_seasons: null,
          number_of_episodes: null,
        });
      }
      return Promise.resolve({ results: [] });
    });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ category: 'tv', count: 1, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    expect(admin.spies.insertedRows[0]).toMatchObject({
      category: 'tv',
      tmdb_id: 3111,
      runtime: null,
    });
  });

  it('covers page loops with empty results and candidateIds/newIds empty branches', async () => {
    const admin = makeAdminMock({
      cursorRaw: 500,
      existingQueue: [{ data: [{ tmdb_id: 3201 }], error: null }],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock
      .mockResolvedValueOnce({ results: [] })
      .mockResolvedValueOnce({ results: [{ id: 3201, title: 'only-existing' }] })
      .mockResolvedValueOnce({ results: [{ id: 3201, title: 'duplicate-in-run' }] });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 2, maxPages: 3 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.pagesScanned).toBe(3);
    expect(body.data.nextCursorPage).toBe(3);
    expect(body.data.inserted).toBe(0);
    expect(body.data.skippedExisting).toBe(1);
  });

  it('covers max-page rollover when candidateIds are empty', async () => {
    const admin = makeAdminMock({ cursorRaw: 500 });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock.mockResolvedValue({
      results: [{ id: -10, title: 'invalid' }],
    });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 1, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.nextCursorPage).toBe(1);
    expect(body.data.pagesScanned).toBe(1);
  });

  it('covers max-page rollover when all candidates already exist', async () => {
    const admin = makeAdminMock({
      cursorRaw: 500,
      existingQueue: [{ data: [{ tmdb_id: 3601 }], error: null }],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock.mockResolvedValue({
      results: [{ id: 3601, title: 'already-existing' }],
    });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 1, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.nextCursorPage).toBe(1);
    expect(body.data.skippedExisting).toBe(1);
  });

  it('covers tv untitled fallback and undefined episode runtime element', async () => {
    const admin = makeAdminMock({ cursorRaw: 500, existingQueue: [{ data: [], error: null }] });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock.mockImplementation((input: { apiName: string }) => {
      if (input.apiName === 'tmdb-popular-tv-page-500') {
        return Promise.resolve({
          results: [{ id: 3701, title: '', name: '', original_name: 'orig-tv' }],
        });
      }
      if (input.apiName === 'tmdb-details-tv-3701') {
        return Promise.resolve({
          episode_run_time: [undefined],
          poster_path: null,
          backdrop_path: null,
          genres: [],
        });
      }
      return Promise.resolve({ results: [] });
    });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ category: 'tv', count: 1, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.nextCursorPage).toBe(1);
    expect(admin.spies.insertedRows[0]).toMatchObject({
      tmdb_id: 3701,
      title: 'Untitled',
      original_title: 'orig-tv',
      runtime: null,
      cover_image_large: null,
      cover_image_medium: null,
      banner_image: null,
    });
  });

  it('returns internal when existing IDs query fails', async () => {
    const admin = makeAdminMock({
      existingQueue: [{ data: null, error: { message: 'existing fail' } }],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock.mockResolvedValue({ results: [{ id: 3301, title: 'x' }] });

    const response = await POST(new Request('https://example.com', { method: 'POST' }));
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('logs warnings for cursor load/save failures and uses NEXT_PUBLIC api key fallback', async () => {
    delete process.env.TMDB_API_KEY;
    process.env.NEXT_PUBLIC_TMDB_API_KEY = ' public-key ';
    const admin = makeAdminMock({
      cursorError: { message: 'load fail' },
      upsertError: { message: 'save fail' },
      existingQueue: [{ data: [], error: null }],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock.mockImplementation((input: { apiName: string }) => {
      if (input.apiName === 'tmdb-popular-movies-page-1') {
        return Promise.resolve({ results: [{ id: 3401, title: 'ok' }] });
      }
      if (input.apiName === 'tmdb-details-movies-3401') {
        return Promise.resolve({ runtime: 100 });
      }
      return Promise.resolve({ results: [] });
    });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ category: 'movies', count: 1, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    expect(warnSpy).toHaveBeenCalledWith('[Admin TMDB Import] Failed to load cursor:', 'load fail');
    expect(warnSpy).toHaveBeenCalledWith('[Admin TMDB Import] Failed to save cursor:', 'save fail');
  });

  it('handles non-array popular response and null existing rows', async () => {
    const admin = makeAdminMock({ existingQueue: [{ data: null, error: null }] });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock
      .mockResolvedValueOnce({ results: [{ id: 3501, title: 'x' }] })
      .mockResolvedValueOnce({ runtime: null, episode_run_time: [], genres: null });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ category: 'movies', count: 1, maxPages: 1 }),
      }),
    );
    expect(response.status).toBe(200);

    cachedExternalFetchMock.mockReset();
    createRouteHandlerClientMock.mockResolvedValue({ auth: {} });
    requireAdminRoleMock.mockResolvedValue({});
    createSupabaseAdminClientMock.mockReturnValue(makeAdminMock().client);
    cachedExternalFetchMock.mockResolvedValue({ results: undefined });

    const response2 = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 1, maxPages: 1 }),
      }),
    );
    expect(response2.status).toBe(200);
    const body2 = await response2.json();
    expect(body2.data.inserted).toBe(0);
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
});
