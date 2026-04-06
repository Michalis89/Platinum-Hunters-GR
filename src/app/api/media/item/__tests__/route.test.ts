/**
 * @jest-environment node
 */

import 'whatwg-fetch';

const createRouteHandlerClientMock = jest.fn();
const isMediaCategoryMock = jest.fn();

jest.mock('next/server', () => ({
  __esModule: true,
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: (...args: unknown[]) => createRouteHandlerClientMock(...args),
}));

jest.mock('@/app/components/backlog/types', () => ({
  __esModule: true,
  isMediaCategory: (...args: unknown[]) => isMediaCategoryMock(...args),
}));

import { GET } from '@/app/api/media/item/route';

type QueryResult = { data: unknown; error: unknown };

type SupabaseConfig = {
  maybeSingleQueue?: QueryResult[];
  limitQueue?: QueryResult[];
};

type MediaItemBuilder = {
  eq: (column: string, value: unknown) => MediaItemBuilder;
  in: (column: string, values: unknown[]) => MediaItemBuilder;
  or: (value: string) => MediaItemBuilder;
  limit: (_n: number) => Promise<QueryResult>;
  maybeSingle: () => Promise<QueryResult>;
};

function makeSupabase(config: SupabaseConfig = {}) {
  const maybeSingleQueue = [...(config.maybeSingleQueue ?? [])];
  const limitQueue = [...(config.limitQueue ?? [])];

  const from = jest.fn((table: string) => {
    if (table !== 'media_items') {
      throw new Error(`Unexpected table: ${table}`);
    }

    const state = {
      eqs: [] as Array<[string, unknown]>,
      inFilters: [] as Array<[string, unknown[]]>,
      orFilter: null as string | null,
    };

    const builder: MediaItemBuilder = {
      eq: (column: string, value: unknown) => {
        state.eqs.push([column, value]);
        return builder;
      },
      in: (column: string, values: unknown[]) => {
        state.inFilters.push([column, values]);
        return builder;
      },
      or: (value: string) => {
        state.orFilter = value;
        return builder;
      },
      limit: (_n: number) => {
        const result = limitQueue.shift() ?? { data: [], error: null };
        return Promise.resolve(result);
      },
      maybeSingle: () => {
        const result = maybeSingleQueue.shift() ?? { data: null, error: null };
        return Promise.resolve(result);
      },
    };

    return {
      select: (_fields: string) => builder,
    };
  });

  return { from };
}

describe('app/api/media/item/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isMediaCategoryMock.mockImplementation((category: string) =>
      ['games', 'anime', 'manga', 'movies', 'tv', 'books'].includes(category),
    );
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 400 when category/slug are invalid', async () => {
    let res = await GET(new Request('http://localhost/api/media/item?category=games'));
    expect(res.status).toBe(400);

    res = await GET(new Request('http://localhost/api/media/item?category=invalid&slug=1'));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid category or slug' });
  });

  it('fetches by numeric id when slug is numeric and id row exists', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        maybeSingleQueue: [
          { data: { id: 12, category: 'games', title: 'Found by id' }, error: null },
        ],
      }),
    );

    const res = await GET(new Request('http://localhost/api/media/item?category=games&slug=12'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      item: { id: 12, category: 'games', title: 'Found by id' },
    });
  });

  it('falls back to external id lookup for numeric slug when id row is missing', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        maybeSingleQueue: [
          { data: null, error: null },
          {
            data: { id: 77, category: 'anime', mal_id: 123, title: 'Found by MAL id' },
            error: null,
          },
        ],
      }),
    );

    const res = await GET(new Request('http://localhost/api/media/item?category=anime&slug=123'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      item: { id: 77, category: 'anime', mal_id: 123, title: 'Found by MAL id' },
    });
  });

  it('returns 404 when non-numeric slug for numeric external-id categories cannot resolve', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        limitQueue: [
          { data: [], error: null },
          { data: [], error: null },
        ],
      }),
    );

    const res = await GET(
      new Request('http://localhost/api/media/item?category=anime&slug=not-numeric'),
    );
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Not found' });
  });

  it('resolves books by external string id when slug lookup misses', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        limitQueue: [{ data: [], error: null }],
        maybeSingleQueue: [
          { data: { id: 20, category: 'books', google_books_id: 'g123' }, error: null },
        ],
      }),
    );

    const res = await GET(new Request('http://localhost/api/media/item?category=books&slug=g123'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      item: { id: 20, category: 'books', google_books_id: 'g123' },
    });
  });

  it('uses exact games igdb_slug matches and ranks by slug score', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        limitQueue: [
          {
            data: [
              {
                id: 1,
                category: 'games',
                igdb_slug: 'divinity-original-sin-enhanced-edition',
                title: 'Divinity Original Sin Enhanced Edition',
              },
              {
                id: 2,
                category: 'games',
                igdb_slug: 'divinity-original-sin',
                title: 'Divinity: Original Sin',
              },
            ],
            error: null,
          },
        ],
      }),
    );

    const res = await GET(
      new Request('http://localhost/api/media/item?category=games&slug=divinity-original-sin'),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      item: {
        id: 2,
        category: 'games',
        igdb_slug: 'divinity-original-sin',
        title: 'Divinity: Original Sin',
      },
    });
  });

  it('falls back to loose slug/title search when exact games igdb_slug search has no rows', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        limitQueue: [
          { data: [], error: null },
          {
            data: [
              { id: 9, category: 'games', igdb_slug: 'foo-bar-deluxe', title: 'Foo Bar Deluxe' },
              { id: 10, category: 'games', igdb_slug: 'foo-bar', title: 'Foo Bar' },
            ],
            error: null,
          },
        ],
      }),
    );

    const res = await GET(
      new Request('http://localhost/api/media/item?category=games&slug=foo-bar'),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      item: { id: 10, category: 'games', igdb_slug: 'foo-bar', title: 'Foo Bar' },
    });
  });

  it('returns 404 when slug cannot match anything (including blank-like slug)', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        limitQueue: [
          { data: [], error: null },
          { data: [], error: null },
        ],
      }),
    );

    let res = await GET(new Request('http://localhost/api/media/item?category=games&slug=%20%20'));
    expect(res.status).toBe(404);

    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        limitQueue: [{ data: [], error: null }],
      }),
    );
    res = await GET(
      new Request('http://localhost/api/media/item?category=movies&slug=unknown-slug'),
    );
    expect(res.status).toBe(404);
  });

  it('handles db errors from id/slug/external lookups with 500', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        maybeSingleQueue: [{ data: null, error: { message: 'id query failed' } }],
      }),
    );
    let res = await GET(new Request('http://localhost/api/media/item?category=games&slug=1'));
    expect(res.status).toBe(500);

    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        limitQueue: [{ data: null, error: { message: 'slug query failed' } }],
      }),
    );
    res = await GET(new Request('http://localhost/api/media/item?category=movies&slug=abc'));
    expect(res.status).toBe(500);

    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        maybeSingleQueue: [
          { data: null, error: null },
          { data: null, error: { message: 'external query failed' } },
        ],
      }),
    );
    res = await GET(new Request('http://localhost/api/media/item?category=tv&slug=44'));
    expect(res.status).toBe(500);
  });

  it('returns 500 when exact games igdb_slug query fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        limitQueue: [{ data: null, error: { message: 'exact slug fail' } }],
      }),
    );

    const res = await GET(
      new Request('http://localhost/api/media/item?category=games&slug=foo-bar'),
    );
    expect(res.status).toBe(500);
  });

  it('returns 404 for games non-numeric slug after slug search miss (external igdb_id guard)', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        limitQueue: [
          { data: [], error: null },
          { data: [], error: null },
        ],
      }),
    );

    const res = await GET(
      new Request('http://localhost/api/media/item?category=games&slug=not-a-number'),
    );
    expect(res.status).toBe(404);
  });

  it('ranks loose matches using includesVariant scoring when prefix match is absent', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        limitQueue: [
          {
            data: [
              { id: 31, category: 'movies', title: 'barfoo' },
              { id: 32, category: 'movies', title: 'xyz' },
            ],
            error: null,
          },
        ],
      }),
    );

    const res = await GET(new Request('http://localhost/api/media/item?category=movies&slug=foo'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      item: { id: 31, category: 'movies', title: 'barfoo' },
    });
  });

  it('falls back to first loose row when all scores are zero', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        limitQueue: [
          {
            data: [
              { id: 41, category: 'movies', title: 'alpha' },
              { id: 42, category: 'movies', title: 'beta' },
            ],
            error: null,
          },
        ],
      }),
    );

    const res = await GET(
      new Request('http://localhost/api/media/item?category=movies&slug=qwerty'),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      item: { id: 41, category: 'movies', title: 'alpha' },
    });
  });
});
