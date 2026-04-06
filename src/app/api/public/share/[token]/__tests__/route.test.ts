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

import { GET } from '@/app/api/public/share/[token]/route';

type SupabaseConfig = {
  tokenRow?: unknown;
  tokenError?: unknown;
  userRow?: unknown;
  userError?: unknown;
  categoryProfile?: unknown;
};

function makeSupabase(config: SupabaseConfig = {}) {
  const tokenRow = Object.prototype.hasOwnProperty.call(config, 'tokenRow')
    ? config.tokenRow
    : { user_id: 'u1', expires_at: null };
  const tokenError = config.tokenError ?? null;
  const userRow = Object.prototype.hasOwnProperty.call(config, 'userRow')
    ? config.userRow
    : { id: 'u1', username: 'john', display_name: 'John', avatar_url: 'https://img/john.png' };
  const userError = config.userError ?? null;
  const categoryProfile = Object.prototype.hasOwnProperty.call(config, 'categoryProfile')
    ? config.categoryProfile
    : { profiles: { games: { steam_id: 'steam-john' } } };

  const tokenMaybeSingle = jest.fn().mockResolvedValue({ data: tokenRow, error: tokenError });
  const tokenEq = jest.fn().mockReturnValue({ maybeSingle: tokenMaybeSingle });
  const tokenSelect = jest.fn().mockReturnValue({ eq: tokenEq });

  const userMaybeSingle = jest.fn().mockResolvedValue({ data: userRow, error: userError });
  const userEq = jest.fn().mockReturnValue({ maybeSingle: userMaybeSingle });
  const userSelect = jest.fn().mockReturnValue({ eq: userEq });

  const categoryMaybeSingle = jest.fn().mockResolvedValue({ data: categoryProfile, error: null });
  const categoryEq = jest.fn().mockReturnValue({ maybeSingle: categoryMaybeSingle });
  const categorySelect = jest.fn().mockReturnValue({ eq: categoryEq });

  const from = jest.fn((table: string) => {
    if (table === 'share_tokens') {
      return { select: tokenSelect };
    }
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

describe('app/api/public/share/[token]/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 400 when token param is missing', async () => {
    const res = await GET(new Request('http://localhost/api/public/share/'), {
      params: Promise.resolve({ token: '' }),
    });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Missing token' });
  });

  it('returns 404 when token query fails, token is missing, or token is expired', async () => {
    getSupabaseServerMock.mockReturnValue(makeSupabase({ tokenError: { message: 'token fail' } }));
    let res = await GET(new Request('http://localhost/api/public/share/bad'), {
      params: Promise.resolve({ token: 'bad' }),
    });
    expect(res.status).toBe(404);

    getSupabaseServerMock.mockReturnValue(makeSupabase({ tokenRow: null }));
    res = await GET(new Request('http://localhost/api/public/share/missing'), {
      params: Promise.resolve({ token: 'missing' }),
    });
    expect(res.status).toBe(404);

    getSupabaseServerMock.mockReturnValue(
      makeSupabase({
        tokenRow: { user_id: 'u1', expires_at: '2000-01-01T00:00:00.000Z' },
      }),
    );
    res = await GET(new Request('http://localhost/api/public/share/expired'), {
      params: Promise.resolve({ token: 'expired' }),
    });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid or expired token' });
  });

  it('returns 404 when user lookup fails or user does not exist', async () => {
    getSupabaseServerMock.mockReturnValue(makeSupabase({ userError: { message: 'user fail' } }));
    let res = await GET(new Request('http://localhost/api/public/share/t1'), {
      params: Promise.resolve({ token: 't1' }),
    });
    expect(res.status).toBe(404);

    getSupabaseServerMock.mockReturnValue(makeSupabase({ userRow: null }));
    res = await GET(new Request('http://localhost/api/public/share/t2'), {
      params: Promise.resolve({ token: 't2' }),
    });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'User not found' });
  });

  it('returns resolved user payload with category profile', async () => {
    getSupabaseServerMock.mockReturnValue(
      makeSupabase({
        tokenRow: { user_id: 'u42', expires_at: null },
        userRow: {
          id: 'u42',
          username: 'maria',
          display_name: 'Maria',
          avatar_url: 'https://img/maria.png',
        },
        categoryProfile: { profiles: { books: { genres: ['Fantasy'] } } },
      }),
    );

    const res = await GET(new Request('http://localhost/api/public/share/valid'), {
      params: Promise.resolve({ token: 'valid' }),
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      userId: 'u42',
      username: 'maria',
      displayName: 'Maria',
      avatarUrl: 'https://img/maria.png',
      categoryProfile: { books: { genres: ['Fantasy'] } },
    });
  });

  it('returns null categoryProfile when category row is missing', async () => {
    getSupabaseServerMock.mockReturnValue(
      makeSupabase({
        categoryProfile: null,
      }),
    );

    const res = await GET(new Request('http://localhost/api/public/share/valid2'), {
      params: Promise.resolve({ token: 'valid2' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.categoryProfile).toBeNull();
  });

  it('returns 500 on unexpected thrown error', async () => {
    getSupabaseServerMock.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const res = await GET(new Request('http://localhost/api/public/share/explode'), {
      params: Promise.resolve({ token: 'explode' }),
    });
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Server error' });
    expect(console.error).toHaveBeenCalledWith('Share token resolve error:', expect.any(Error));
  });
});
