/**
 * @jest-environment node
 */

import 'whatwg-fetch';

jest.mock('next/server', () => ({
  __esModule: true,
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

const getSupabaseServerMock = jest.fn();
jest.mock('@/lib/supabase-server', () => ({
  __esModule: true,
  default: (...args: unknown[]) => getSupabaseServerMock(...args),
}));

jest.mock('@/lib/api/media/config', () => ({
  __esModule: true,
  MEDIA_CATEGORY_CONFIGS: {
    anime: { subcategories: ['anime', 'manga'], librarySelectFields: 'anime_fields' },
    games: { subcategories: ['games'], librarySelectFields: 'games_fields' },
    books: { subcategories: ['books'], librarySelectFields: 'books_fields' },
  },
}));

const mapLibraryEntryMock = jest.fn();
jest.mock('@/lib/api/media/utils/entry-mapper', () => ({
  __esModule: true,
  mapLibraryEntry: (...args: unknown[]) => mapLibraryEntryMock(...args),
}));

import { GET } from '@/app/api/public/share/[token]/backlog/route';

type SupabaseConfig = {
  tokenRow?: unknown;
  entriesData?: unknown;
  entriesError?: unknown;
};

function makeSupabase(config: SupabaseConfig = {}) {
  const tokenRow = Object.prototype.hasOwnProperty.call(config, 'tokenRow')
    ? config.tokenRow
    : { user_id: 'u1', expires_at: null };
  const entriesData = Object.prototype.hasOwnProperty.call(config, 'entriesData')
    ? config.entriesData
    : [];
  const entriesError = config.entriesError ?? null;

  const tokenMaybeSingle = jest.fn().mockResolvedValue({ data: tokenRow });
  const tokenEq = jest.fn().mockReturnValue({ maybeSingle: tokenMaybeSingle });
  const tokenSelect = jest.fn().mockReturnValue({ eq: tokenEq });

  const entriesOrder2 = jest.fn().mockResolvedValue({ data: entriesData, error: entriesError });
  const entriesOrder1 = jest.fn().mockReturnValue({ order: entriesOrder2 });
  const entriesEq2 = jest.fn().mockReturnValue({ order: entriesOrder1 });
  const entriesEq1 = jest.fn().mockReturnValue({ eq: entriesEq2 });
  const entriesSelect = jest.fn().mockReturnValue({ eq: entriesEq1 });

  const from = jest.fn((table: string) => {
    if (table === 'share_tokens') {
      return { select: tokenSelect };
    }
    if (table === 'user_media_entries') {
      return { select: entriesSelect };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return { from };
}

describe('app/api/public/share/[token]/backlog/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mapLibraryEntryMock.mockImplementation((row: unknown) => row);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 400 when category is unsupported', async () => {
    const res = await GET(
      new Request('http://localhost/api/public/share/t1/backlog?category=unsupported'),
      {
        params: Promise.resolve({ token: 't1' }),
      },
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Unsupported category' });
  });

  it('returns 404 when token is missing or expired', async () => {
    getSupabaseServerMock.mockReturnValueOnce(makeSupabase({ tokenRow: null }));
    let res = await GET(
      new Request('http://localhost/api/public/share/t2/backlog?category=anime'),
      {
        params: Promise.resolve({ token: 't2' }),
      },
    );
    expect(res.status).toBe(404);

    getSupabaseServerMock.mockReturnValueOnce(
      makeSupabase({ tokenRow: { user_id: 'u1', expires_at: '2000-01-01T00:00:00.000Z' } }),
    );
    res = await GET(new Request('http://localhost/api/public/share/t3/backlog?category=anime'), {
      params: Promise.resolve({ token: 't3' }),
    });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid or expired token' });
  });

  it('returns mapped items and defaults category/status when query params are omitted', async () => {
    getSupabaseServerMock.mockReturnValue(
      makeSupabase({
        tokenRow: { user_id: 'u42', expires_at: null },
        entriesData: [{ id: 1 }, { id: 2 }],
      }),
    );
    mapLibraryEntryMock
      .mockImplementationOnce(() => ({ id: 'mapped-1', status: 'planned' }))
      .mockImplementationOnce(() => null);

    const res = await GET(new Request('http://localhost/api/public/share/default/backlog'), {
      params: Promise.resolve({ token: 'default' }),
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      userId: 'u42',
      category: 'anime',
      status: 'all',
      items: [{ id: 'mapped-1', status: 'planned' }],
    });
  });

  it('filters items by status when status query param is provided', async () => {
    getSupabaseServerMock.mockReturnValue(
      makeSupabase({
        tokenRow: { user_id: 'u7', expires_at: null },
        entriesData: [{ id: 1 }, { id: 2 }, { id: 3 }],
      }),
    );
    mapLibraryEntryMock
      .mockImplementationOnce(() => ({ id: 'a', status: 'planned' }))
      .mockImplementationOnce(() => ({ id: 'b', status: 'completed' }))
      .mockImplementationOnce(() => ({ id: 'c', status: 'planned' }));

    const res = await GET(
      new Request('http://localhost/api/public/share/t4/backlog?category=anime&status=planned'),
      {
        params: Promise.resolve({ token: 't4' }),
      },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      userId: 'u7',
      category: 'anime',
      status: 'planned',
      items: [
        { id: 'a', status: 'planned' },
        { id: 'c', status: 'planned' },
      ],
    });
  });

  it('returns empty items when entries data is not an array', async () => {
    getSupabaseServerMock.mockReturnValue(
      makeSupabase({
        tokenRow: { user_id: 'u9', expires_at: null },
        entriesData: null,
      }),
    );

    const res = await GET(
      new Request('http://localhost/api/public/share/t5/backlog?category=books'),
      {
        params: Promise.resolve({ token: 't5' }),
      },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      userId: 'u9',
      category: 'books',
      status: 'all',
      items: [],
    });
  });

  it('returns 500 when entries query has an error', async () => {
    getSupabaseServerMock.mockReturnValue(
      makeSupabase({
        entriesError: { message: 'query failed' },
      }),
    );

    const res = await GET(
      new Request('http://localhost/api/public/share/t6/backlog?category=anime'),
      {
        params: Promise.resolve({ token: 't6' }),
      },
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Server error' });
    expect(console.error).toHaveBeenCalledWith(
      'Public share backlog fetch error:',
      expect.anything(),
    );
  });

  it('returns 500 on unexpected thrown error', async () => {
    getSupabaseServerMock.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const res = await GET(
      new Request('http://localhost/api/public/share/t7/backlog?category=anime'),
      {
        params: Promise.resolve({ token: 't7' }),
      },
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Server error' });
  });
});
