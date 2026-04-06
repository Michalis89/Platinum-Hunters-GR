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

import { GET } from '@/app/api/public/user/[username]/backlog/route';

type SupabaseConfig = {
  userRow?: unknown;
  entriesData?: unknown;
  entriesError?: unknown;
};

function makeSupabase(config: SupabaseConfig = {}) {
  const userRow = Object.prototype.hasOwnProperty.call(config, 'userRow')
    ? config.userRow
    : {
        id: 'u1',
        privacy_settings: { profile_visibility: 'public' },
      };
  const entriesData = Object.prototype.hasOwnProperty.call(config, 'entriesData')
    ? config.entriesData
    : [];
  const entriesError = config.entriesError ?? null;

  const userMaybeSingle = jest.fn().mockResolvedValue({ data: userRow, error: null });
  const userEq = jest.fn().mockReturnValue({ maybeSingle: userMaybeSingle });
  const userSelect = jest.fn().mockReturnValue({ eq: userEq });

  const entriesOrder2 = jest.fn().mockResolvedValue({ data: entriesData, error: entriesError });
  const entriesOrder1 = jest.fn().mockReturnValue({ order: entriesOrder2 });
  const entriesEq2 = jest.fn().mockReturnValue({ order: entriesOrder1 });
  const entriesEq1 = jest.fn().mockReturnValue({ eq: entriesEq2 });
  const entriesSelect = jest.fn().mockReturnValue({ eq: entriesEq1 });

  const from = jest.fn((table: string) => {
    if (table === 'users') {
      return { select: userSelect };
    }
    if (table === 'user_media_entries') {
      return { select: entriesSelect };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return { from };
}

describe('app/api/public/user/[username]/backlog/route', () => {
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
      new Request('http://localhost/api/public/user/john/backlog?category=unsupported'),
      {
        params: Promise.resolve({ username: 'john' }),
      },
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Unsupported category' });
  });

  it('returns 404 when user is missing', async () => {
    getSupabaseServerMock.mockReturnValue(makeSupabase({ userRow: null }));

    const res = await GET(
      new Request('http://localhost/api/public/user/missing/backlog?category=anime'),
      {
        params: Promise.resolve({ username: 'missing' }),
      },
    );

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'User not found' });
  });

  it('returns 403 when profile is private', async () => {
    getSupabaseServerMock.mockReturnValue(
      makeSupabase({
        userRow: {
          id: 'u2',
          privacy_settings: { profile_visibility: 'private' },
        },
      }),
    );

    const res = await GET(
      new Request('http://localhost/api/public/user/private/backlog?category=anime'),
      {
        params: Promise.resolve({ username: 'private' }),
      },
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Profile is private' });
  });

  it('returns mapped items and defaults category/status', async () => {
    getSupabaseServerMock.mockReturnValue(
      makeSupabase({
        userRow: {
          id: 'u3',
          privacy_settings: { profile_visibility: 'public' },
        },
        entriesData: [{ id: 1 }, { id: 2 }],
      }),
    );
    mapLibraryEntryMock
      .mockImplementationOnce(() => ({ id: 'mapped-1', status: 'planned' }))
      .mockImplementationOnce(() => null);

    const res = await GET(new Request('http://localhost/api/public/user/john/backlog'), {
      params: Promise.resolve({ username: 'john' }),
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      userId: 'u3',
      category: 'anime',
      status: 'all',
      items: [{ id: 'mapped-1', status: 'planned' }],
    });
  });

  it('filters items by status when status query param is provided', async () => {
    getSupabaseServerMock.mockReturnValue(
      makeSupabase({
        userRow: {
          id: 'u4',
          privacy_settings: { profile_visibility: 'public' },
        },
        entriesData: [{ id: 1 }, { id: 2 }, { id: 3 }],
      }),
    );
    mapLibraryEntryMock
      .mockImplementationOnce(() => ({ id: 'a', status: 'planned' }))
      .mockImplementationOnce(() => ({ id: 'b', status: 'completed' }))
      .mockImplementationOnce(() => ({ id: 'c', status: 'planned' }));

    const res = await GET(
      new Request('http://localhost/api/public/user/john/backlog?category=anime&status=planned'),
      {
        params: Promise.resolve({ username: 'john' }),
      },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      userId: 'u4',
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
        userRow: {
          id: 'u5',
          privacy_settings: { profile_visibility: 'public' },
        },
        entriesData: null,
      }),
    );

    const res = await GET(
      new Request('http://localhost/api/public/user/john/backlog?category=books'),
      {
        params: Promise.resolve({ username: 'john' }),
      },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      userId: 'u5',
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
      new Request('http://localhost/api/public/user/john/backlog?category=anime'),
      {
        params: Promise.resolve({ username: 'john' }),
      },
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Server error' });
    expect(console.error).toHaveBeenCalledWith(
      'Public username backlog fetch error:',
      expect.anything(),
    );
  });

  it('returns 500 on unexpected thrown error', async () => {
    getSupabaseServerMock.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const res = await GET(
      new Request('http://localhost/api/public/user/john/backlog?category=anime'),
      {
        params: Promise.resolve({ username: 'john' }),
      },
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Server error' });
  });
});
