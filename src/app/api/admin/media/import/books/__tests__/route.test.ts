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
import { POST, dynamic, maxDuration } from '@/app/api/admin/media/import/books/route';

type ExistingResult = { data: Array<{ google_books_id: string }> | null; error: unknown };

function makeAdminMock(config?: {
  cursorData?: unknown;
  cursorLoadError?: unknown;
  cursorSaveError?: unknown;
  existingQueue?: ExistingResult[];
  insertBehavior?: Record<string, 'ok' | 'duplicate' | 'failed' | 'failed-string'>;
}) {
  const existingQueue = [...(config?.existingQueue ?? [{ data: [], error: null }])];
  const insertBehavior = config?.insertBehavior ?? {};
  const insertedRows: Array<Record<string, unknown>> = [];
  const upserts: Array<Record<string, unknown>> = [];

  const apiCacheMaybeSingle = jest
    .fn()
    .mockResolvedValue({
      data: config?.cursorData ?? null,
      error: config?.cursorLoadError ?? null,
    });
  const apiCacheEq = jest.fn().mockReturnValue({ maybeSingle: apiCacheMaybeSingle });
  const apiCacheSelect = jest.fn().mockReturnValue({ eq: apiCacheEq });
  const apiCacheUpsert = jest.fn().mockImplementation((payload: Record<string, unknown>) => {
    upserts.push(payload);
    return Promise.resolve({ error: config?.cursorSaveError ?? null });
  });

  const mediaExistingIn = jest.fn().mockImplementation(() => {
    const next = existingQueue.shift() ?? { data: [], error: null };
    return Promise.resolve(next);
  });
  const mediaExistingEq = jest.fn().mockReturnValue({ in: mediaExistingIn });
  const mediaSelect = jest.fn().mockReturnValue({ eq: mediaExistingEq });
  const mediaInsert = jest.fn().mockImplementation((row: Record<string, unknown>) => {
    insertedRows.push(row);
    const id = String(row.google_books_id ?? '');
    const behavior = insertBehavior[id] ?? 'ok';
    if (behavior === 'duplicate') {
      return Promise.resolve({ error: { code: '23505' } });
    }
    if (behavior === 'failed-string') {
      return Promise.resolve({ error: 'raw-insert-error' });
    }
    if (behavior === 'failed') {
      return Promise.resolve({ error: { code: 'XX000' } });
    }
    return Promise.resolve({ error: null });
  });

  const from = jest.fn().mockImplementation((table: string) => {
    if (table === 'api_cache') {
      return {
        select: apiCacheSelect,
        upsert: apiCacheUpsert,
      };
    }
    if (table === 'media_items') {
      return {
        select: mediaSelect,
        insert: mediaInsert,
      };
    }
    return {};
  });

  return {
    client: { from },
    spies: {
      insertedRows,
      upserts,
      mediaSelect,
      mediaExistingEq,
      mediaExistingIn,
      mediaInsert,
      apiCacheSelect,
      apiCacheEq,
      apiCacheMaybeSingle,
      apiCacheUpsert,
    },
  };
}

describe('app/api/admin/media/import/books/route', () => {
  const originalApiKey = process.env.GOOGLE_BOOKS_API_KEY;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_BOOKS_API_KEY = 'books-key';
    createRouteHandlerClientMock.mockResolvedValue({ auth: {} });
    requireAdminRoleMock.mockResolvedValue({});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  afterAll(() => {
    if (originalApiKey === undefined) {
      delete process.env.GOOGLE_BOOKS_API_KEY;
    } else {
      process.env.GOOGLE_BOOKS_API_KEY = originalApiKey;
    }
  });

  it('exports route metadata', () => {
    expect(dynamic).toBe('force-dynamic');
    expect(maxDuration).toBe(60);
  });

  it('returns error when GOOGLE_BOOKS_API_KEY is missing', async () => {
    delete process.env.GOOGLE_BOOKS_API_KEY;
    createSupabaseAdminClientMock.mockReturnValue(makeAdminMock().client);

    const response = await POST(
      new Request('https://example.com', { method: 'POST', body: JSON.stringify({}) }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Missing GOOGLE_BOOKS_API_KEY in server environment.',
      code: 'GOOGLE_BOOKS_API_KEY_MISSING',
    });
  });

  it('imports books with normalization, dedupe handling and cursor save', async () => {
    const admin = makeAdminMock({
      cursorData: { data: { nextOffset: 40 } },
      existingQueue: [
        { data: [{ google_books_id: 'existing-1' }], error: null },
        { data: [], error: null },
      ],
      insertBehavior: {
        'dup-1': 'duplicate',
        'fail-1': 'failed',
      },
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);

    cachedExternalFetchMock
      .mockResolvedValueOnce({
        items: [
          {
            id: 'existing-1',
            volumeInfo: { title: 'Already There' },
          },
          {
            id: 'new-1',
            volumeInfo: {
              title: '  Book One  ',
              subtitle: 'Sub',
              authors: ['A', 'B'],
              categories: ['Fantasy'],
              description: 'Desc',
              pageCount: 123,
              publishedDate: '2024-02',
              imageLinks: { thumbnail: 'http://img/1', smallThumbnail: 'http://img/s1' },
            },
          },
          {
            id: 'dup-1',
            volumeInfo: { title: 'Duplicate' },
          },
          {
            id: 'fail-1',
            volumeInfo: { title: 'Failure' },
          },
          {
            id: 'new-2',
            volumeInfo: { title: 'Book Two', publishedDate: '2023' },
          },
          {
            id: 'new-2',
            volumeInfo: { title: 'Book Two duplicate in-page' },
          },
          {
            id: '',
            volumeInfo: { title: 'Missing id' },
          },
        ],
      })
      .mockResolvedValueOnce({ items: [] });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 3, maxPages: 3, query: ' subject:fantasy ' }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.data).toMatchObject({
      category: 'books',
      requested: 3,
      query: 'subject:fantasy',
      inserted: 2,
      skippedExisting: 2,
      failed: 1,
      pagesScanned: 2,
      startOffset: 40,
      nextCursorOffset: 0,
      reachedTarget: false,
    });

    expect(cachedExternalFetchMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        apiName: 'google-books-catalog-40',
        endpoint: expect.stringContaining('startIndex=40'),
      }),
    );

    const insertedNew1 = admin.spies.insertedRows.find(row => row.google_books_id === 'new-1');
    expect(insertedNew1).toMatchObject({
      category: 'books',
      source: 'google_books',
      title: '  Book One  ',
      original_title: 'Sub',
      release_date: '2024-02-01',
      cover_image_large: 'https://img/1',
      cover_image_medium: 'https://img/s1',
      status: 'published',
    });

    const insertedNew2 = admin.spies.insertedRows.find(row => row.google_books_id === 'new-2');
    expect(insertedNew2).toMatchObject({
      release_date: null,
    });

    expect(admin.spies.apiCacheUpsert).toHaveBeenCalled();
    expect(admin.spies.upserts[0]).toEqual(
      expect.objectContaining({
        key: 'admin-books-import-cursor:subject:fantasy',
        data: { nextOffset: 0 },
      }),
    );
  });

  it('returns internal when existing rows query fails', async () => {
    const admin = makeAdminMock({
      existingQueue: [{ data: null, error: { message: 'existing failed' } }],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock.mockResolvedValue({
      items: [{ id: 'book-1', volumeInfo: { title: 'X' } }],
    });

    const response = await POST(
      new Request('https://example.com', { method: 'POST', body: JSON.stringify({}) }),
    );

    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('handles empty pages, cursor fallbacks and save cursor warning', async () => {
    const admin = makeAdminMock({
      cursorData: { data: { nextOffset: 99999 } },
      cursorSaveError: { message: 'upsert failed' },
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock.mockResolvedValue({ items: [] });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: -1, maxPages: 0, query: '' }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      requested: 200,
      query: 'subject:fiction',
      pagesScanned: 1,
      startOffset: 0,
      nextCursorOffset: 0,
    });
    expect(warnSpy).toHaveBeenCalled();
  });

  it('falls back to offset 0 when loading cursor fails', async () => {
    const admin = makeAdminMock({
      cursorLoadError: { message: 'cursor read failed' },
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock.mockResolvedValue({ items: [] });

    const response = await POST(
      new Request('https://example.com', { method: 'POST', body: JSON.stringify({ query: 'Q1' }) }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.startOffset).toBe(0);
    expect(warnSpy).toHaveBeenCalledWith(
      '[Admin Books Import] Failed to load cursor:',
      'cursor read failed',
    );
  });

  it('continues scanning when a page contains no eligible candidate IDs', async () => {
    const admin = makeAdminMock({
      cursorData: { data: { nextOffset: 0 } },
      existingQueue: [{ data: [], error: null }],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock
      .mockResolvedValueOnce({
        items: [{ id: 'same-1', volumeInfo: { title: 'A' } }],
      })
      .mockResolvedValueOnce({
        items: [{ id: 'same-1', volumeInfo: { title: 'A duplicate' } }],
      });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 2, maxPages: 2 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.pagesScanned).toBe(2);
    expect(body.data.inserted).toBe(1);
    expect(body.data.nextCursorOffset).toBe(80);
  });

  it('normalizes year/invalid dates and counts non-object insert errors as failed', async () => {
    const admin = makeAdminMock({
      existingQueue: [{ data: [], error: null }],
      insertBehavior: { 'book-invalid': 'failed-string' },
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock.mockResolvedValue({
      items: [
        { id: 'book-year', volumeInfo: { title: 'Year', publishedDate: '2022' } },
        { id: 'book-invalid', volumeInfo: { title: 'Invalid', publishedDate: 'Spring 2022' } },
      ],
    });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 2, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.inserted).toBe(1);
    expect(body.data.failed).toBe(1);

    const yearRow = admin.spies.insertedRows.find(row => row.google_books_id === 'book-year');
    expect(yearRow).toMatchObject({ release_date: '2022-01-01' });
    const invalidRow = admin.spies.insertedRows.find(row => row.google_books_id === 'book-invalid');
    expect(invalidRow).toMatchObject({ release_date: null });
  });

  it('handles payload without items and null existing rows safely', async () => {
    const admin = makeAdminMock({
      existingQueue: [{ data: null, error: null }],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock
      .mockResolvedValueOnce({
        items: [{ id: 'book-plain' }],
      })
      .mockResolvedValueOnce({});

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 2, maxPages: 2 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.inserted).toBe(1);

    const plainRow = admin.spies.insertedRows.find(row => row.google_books_id === 'book-plain');
    expect(plainRow).toMatchObject({
      title: 'Untitled',
      cover_image_large: null,
      cover_image_medium: null,
    });
  });

  it('keeps https cover URLs unchanged', async () => {
    const admin = makeAdminMock({ existingQueue: [{ data: [], error: null }] });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock.mockResolvedValue({
      items: [
        {
          id: 'https-cover',
          volumeInfo: {
            title: 'HTTPS',
            imageLinks: { thumbnail: 'https://cdn/cover.jpg' },
          },
        },
      ],
    });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 1, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    const row = admin.spies.insertedRows.find(r => r.google_books_id === 'https-cover');
    expect(row).toMatchObject({ cover_image_large: 'https://cdn/cover.jpg' });
  });

  it('wraps cursor to 0 on empty-candidate page at MAX_OFFSET', async () => {
    const admin = makeAdminMock({
      cursorData: { data: { nextOffset: 1000 } },
      existingQueue: [{ data: [], error: null }],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock
      .mockResolvedValueOnce({
        items: [{ id: 'same-id', volumeInfo: { title: 'First' } }],
      })
      .mockResolvedValueOnce({
        items: [{ id: 'same-id', volumeInfo: { title: 'Duplicate of seen id' } }],
      });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 2, maxPages: 2 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.nextCursorOffset).toBe(40);
  });

  it('returns unauthorized / forbidden for admin auth errors', async () => {
    createSupabaseAdminClientMock.mockReturnValue(makeAdminMock().client);

    requireAdminRoleMock.mockRejectedValueOnce(new UnauthorizedError());
    const r1 = await POST(new Request('https://example.com', { method: 'POST' }));
    expect(r1.status).toBe(API_ERRORS.UNAUTHORIZED.status);

    requireAdminRoleMock.mockRejectedValueOnce(new ForbiddenError());
    const r2 = await POST(new Request('https://example.com', { method: 'POST' }));
    expect(r2.status).toBe(API_ERRORS.FORBIDDEN.status);
  });

  it('returns internal for unexpected top-level exceptions', async () => {
    createSupabaseAdminClientMock.mockReturnValue(makeAdminMock().client);
    cachedExternalFetchMock.mockRejectedValue(new Error('network down'));

    const response = await POST(
      new Request('https://example.com', { method: 'POST', body: JSON.stringify({}) }),
    );
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('resets cursor to zero when next page would exceed MAX_OFFSET', async () => {
    const admin = makeAdminMock({
      cursorData: { data: { nextOffset: 1000 } },
      existingQueue: [{ data: [], error: null }],
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);
    cachedExternalFetchMock.mockResolvedValue({
      items: [{ id: 'book-a', volumeInfo: { title: 'A', publishedDate: '2024-01-02' } }],
    });

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ count: 1, maxPages: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.nextCursorOffset).toBe(0);
  });
});
