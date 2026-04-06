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

import { GET } from '@/app/api/public/user/[username]/route';

type SupabaseConfig = {
  userRow?: unknown;
  userError?: unknown;
  categoryProfile?: unknown;
};

function makeSupabase(config: SupabaseConfig = {}) {
  const userRow = Object.prototype.hasOwnProperty.call(config, 'userRow')
    ? config.userRow
    : {
        id: 'u1',
        username: 'john',
        display_name: 'John',
        avatar_url: 'https://img/john.png',
        privacy_settings: { profile_visibility: 'public' },
      };
  const userError = config.userError ?? null;
  const categoryProfile = Object.prototype.hasOwnProperty.call(config, 'categoryProfile')
    ? config.categoryProfile
    : { profiles: { games: { steam_id: 'steam-u1' } } };

  const userMaybeSingle = jest.fn().mockResolvedValue({ data: userRow, error: userError });
  const userEq = jest.fn().mockReturnValue({ maybeSingle: userMaybeSingle });
  const userSelect = jest.fn().mockReturnValue({ eq: userEq });

  const categoryMaybeSingle = jest.fn().mockResolvedValue({ data: categoryProfile, error: null });
  const categoryEq = jest.fn().mockReturnValue({ maybeSingle: categoryMaybeSingle });
  const categorySelect = jest.fn().mockReturnValue({ eq: categoryEq });

  const from = jest.fn((table: string) => {
    if (table === 'users') {
      return { select: userSelect };
    }
    if (table === 'user_category_profiles') {
      return { select: categorySelect };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return { from };
}

describe('app/api/public/user/[username]/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 404 when user query errors or user is missing', async () => {
    getSupabaseServerMock.mockReturnValueOnce(makeSupabase({ userError: { message: 'db fail' } }));
    let res = await GET(new Request('http://localhost/api/public/user/john'), {
      params: Promise.resolve({ username: 'john' }),
    });
    expect(res.status).toBe(404);

    getSupabaseServerMock.mockReturnValueOnce(makeSupabase({ userRow: null }));
    res = await GET(new Request('http://localhost/api/public/user/missing'), {
      params: Promise.resolve({ username: 'missing' }),
    });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'User not found' });
  });

  it('returns 403 when profile visibility is private', async () => {
    getSupabaseServerMock.mockReturnValue(
      makeSupabase({
        userRow: {
          id: 'u2',
          username: 'maria',
          display_name: 'Maria',
          avatar_url: null,
          privacy_settings: { profile_visibility: 'private' },
        },
      }),
    );

    const res = await GET(new Request('http://localhost/api/public/user/maria'), {
      params: Promise.resolve({ username: 'maria' }),
    });

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Profile is private' });
  });

  it('returns public user payload and category profile', async () => {
    getSupabaseServerMock.mockReturnValue(
      makeSupabase({
        userRow: {
          id: 'u3',
          username: 'kate',
          display_name: 'Kate',
          avatar_url: 'https://img/kate.png',
          privacy_settings: null,
        },
        categoryProfile: { profiles: { books: { genres: ['Fantasy'] } } },
      }),
    );

    const res = await GET(new Request('http://localhost/api/public/user/kate'), {
      params: Promise.resolve({ username: 'kate' }),
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      userId: 'u3',
      username: 'kate',
      displayName: 'Kate',
      avatarUrl: 'https://img/kate.png',
      categoryProfile: { books: { genres: ['Fantasy'] } },
    });
  });

  it('returns null categoryProfile when category row is missing', async () => {
    getSupabaseServerMock.mockReturnValue(
      makeSupabase({
        userRow: {
          id: 'u4',
          username: 'leo',
          display_name: 'Leo',
          avatar_url: null,
          privacy_settings: { profile_visibility: 'public' },
        },
        categoryProfile: null,
      }),
    );

    const res = await GET(new Request('http://localhost/api/public/user/leo'), {
      params: Promise.resolve({ username: 'leo' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.categoryProfile).toBeNull();
  });

  it('returns 500 on unexpected thrown error', async () => {
    getSupabaseServerMock.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const res = await GET(new Request('http://localhost/api/public/user/broken'), {
      params: Promise.resolve({ username: 'broken' }),
    });

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Server error' });
    expect(console.error).toHaveBeenCalledWith('Public user resolve error:', expect.any(Error));
  });
});
