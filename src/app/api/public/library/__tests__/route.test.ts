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

import { GET } from '@/app/api/public/library/route';

type SupabaseConfig = {
  userRow?: unknown;
  tokenRow?: unknown;
  entriesData?: unknown;
  entriesError?: unknown;
};

function makeSupabase(config: SupabaseConfig = {}) {
  const userRow = Object.prototype.hasOwnProperty.call(config, 'userRow')
    ? config.userRow
    : { privacy_settings: { profile_visibility: 'public' } };
  const tokenRow = Object.prototype.hasOwnProperty.call(config, 'tokenRow')
    ? config.tokenRow
    : null;
  const entriesData = Object.prototype.hasOwnProperty.call(config, 'entriesData')
    ? config.entriesData
    : [];
  const entriesError = config.entriesError ?? null;

  const usersMaybeSingle = jest.fn().mockResolvedValue({ data: userRow, error: null });
  const usersEq = jest.fn().mockReturnValue({ maybeSingle: usersMaybeSingle });
  const usersSelect = jest.fn().mockReturnValue({ eq: usersEq });

  const tokenMaybeSingle = jest.fn().mockResolvedValue({ data: tokenRow });
  const tokenEq = jest.fn().mockReturnValue({ maybeSingle: tokenMaybeSingle });
  const tokenSelect = jest.fn().mockReturnValue({ eq: tokenEq });

  const entriesOrder2 = jest.fn().mockResolvedValue({ data: entriesData, error: entriesError });
  const entriesOrder1 = jest.fn().mockReturnValue({ order: entriesOrder2 });
  const entriesEq2 = jest.fn().mockReturnValue({ order: entriesOrder1 });
  const entriesEq1 = jest.fn().mockReturnValue({ eq: entriesEq2 });
  const entriesSelect = jest.fn().mockReturnValue({ eq: entriesEq1 });

  const from = jest.fn((table: string) => {
    if (table === 'users') {
      return { select: usersSelect };
    }
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

describe('app/api/public/library/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mapLibraryEntryMock.mockImplementation((row: unknown) => row);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 400 when userId is missing', async () => {
    const res = await GET(new Request('http://localhost/api/public/library?category=anime'));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Missing userId' });
  });

  it('returns 400 when category is unsupported', async () => {
    const res = await GET(
      new Request('http://localhost/api/public/library?userId=u1&category=unsupported'),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Unsupported category' });
  });

  it('returns 404 when user does not exist', async () => {
    getSupabaseServerMock.mockReturnValue(makeSupabase({ userRow: null }));

    const res = await GET(
      new Request('http://localhost/api/public/library?userId=u1&category=anime'),
    );
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'User not found' });
  });

  it('returns 403 for private profile without token', async () => {
    getSupabaseServerMock.mockReturnValue(
      makeSupabase({ userRow: { privacy_settings: { profile_visibility: 'private' } } }),
    );

    const res = await GET(
      new Request('http://localhost/api/public/library?userId=u1&category=anime'),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Profile is private' });
  });

  it('returns 403 for invalid share token (missing row, wrong user, expired)', async () => {
    getSupabaseServerMock.mockReturnValue(
      makeSupabase({
        userRow: { privacy_settings: { profile_visibility: 'private' } },
        tokenRow: null,
      }),
    );
    let res = await GET(
      new Request('http://localhost/api/public/library?userId=u1&category=anime&token=t1'),
    );
    expect(res.status).toBe(403);

    getSupabaseServerMock.mockReturnValue(
      makeSupabase({
        userRow: { privacy_settings: { profile_visibility: 'private' } },
        tokenRow: { user_id: 'other-user', expires_at: null },
      }),
    );
    res = await GET(
      new Request('http://localhost/api/public/library?userId=u1&category=anime&token=t2'),
    );
    expect(res.status).toBe(403);

    getSupabaseServerMock.mockReturnValue(
      makeSupabase({
        userRow: { privacy_settings: { profile_visibility: 'private' } },
        tokenRow: { user_id: 'u1', expires_at: '2000-01-01T00:00:00.000Z' },
      }),
    );
    res = await GET(
      new Request('http://localhost/api/public/library?userId=u1&category=anime&token=t3'),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid share token' });
  });

  it('returns mapped items for public profile and defaults category to anime', async () => {
    getSupabaseServerMock.mockReturnValue(
      makeSupabase({
        userRow: { privacy_settings: { profile_visibility: 'public' } },
        entriesData: [{ id: 1 }, { id: 2 }],
      }),
    );
    mapLibraryEntryMock
      .mockImplementationOnce(() => ({ mapped: 1 }))
      .mockImplementationOnce(() => null);

    const res = await GET(new Request('http://localhost/api/public/library?userId=u1'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      items: [{ mapped: 1 }],
    });
  });

  it('returns items for private profile with valid non-expired token and handles non-array data', async () => {
    getSupabaseServerMock.mockReturnValue(
      makeSupabase({
        userRow: { privacy_settings: { profile_visibility: 'private' } },
        tokenRow: {
          user_id: 'u1',
          expires_at: '2999-01-01T00:00:00.000Z',
        },
        entriesData: null,
      }),
    );

    const res = await GET(
      new Request('http://localhost/api/public/library?userId=u1&category=games&token=valid'),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ items: [] });
  });

  it('returns 500 and empty items when entries query throws', async () => {
    getSupabaseServerMock.mockReturnValue(
      makeSupabase({
        entriesError: { message: 'entries query failed' },
      }),
    );

    const res = await GET(
      new Request('http://localhost/api/public/library?userId=u1&category=anime'),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ items: [] });
    expect(console.error).toHaveBeenCalledWith('Public library fetch error:', expect.anything());
  });
});
