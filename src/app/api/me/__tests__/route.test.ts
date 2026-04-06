/**
 * @jest-environment node
 */

import 'whatwg-fetch';

const createRouteHandlerClientMock = jest.fn();
const requireAuthMock = jest.fn();
const fetchTopGenresMock = jest.fn();

jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: (...args: unknown[]) => createRouteHandlerClientMock(...args),
}));

jest.mock('@/lib/api/auth', () => ({
  __esModule: true,
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
  UnauthorizedError: class UnauthorizedError extends Error {},
}));

jest.mock('@/lib/profile/genre-affinity', () => ({
  __esModule: true,
  fetchTopGenres: (...args: unknown[]) => fetchTopGenresMock(...args),
}));

jest.mock('@/lib/api/response', () => ({
  __esModule: true,
  ok: jest.fn((body: unknown, init?: ResponseInit) => ({
    status: init?.status ?? 200,
    headers: new Headers((init as { headers?: HeadersInit } | undefined)?.headers),
    json: async () => ({ data: body }),
  })),
  fail: jest.fn((body: unknown, status: number, init?: ResponseInit) => ({
    status,
    headers: new Headers((init as { headers?: HeadersInit } | undefined)?.headers),
    json: async () => body,
  })),
}));

import { GET } from '@/app/api/me/route';
import { UnauthorizedError } from '@/lib/api/auth';
import { API_ERRORS } from '@/lib/api/errors';

type SupabaseOpts = {
  userData?: unknown;
  userError?: unknown;
  categoryProfileData?: unknown;
};

function makeSupabase(opts: SupabaseOpts = {}) {
  const userData = opts.userData ?? { id: 'user-1', username: 'john', display_name: 'John' };
  const userError = opts.userError ?? null;
  const hasCategoryProfileData = Object.prototype.hasOwnProperty.call(opts, 'categoryProfileData');
  const categoryProfileData = hasCategoryProfileData
    ? opts.categoryProfileData
    : {
        profiles: { games: { steam_id: '123' } },
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
      };

  const userSingle = jest.fn().mockResolvedValue({ data: userData, error: userError });
  const userEq = jest.fn().mockReturnValue({ single: userSingle });
  const userSelect = jest.fn().mockReturnValue({ eq: userEq });

  const categoryMaybeSingle = jest
    .fn()
    .mockResolvedValue({ data: categoryProfileData, error: null });
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

  return { from, spies: { userSingle, categoryMaybeSingle } };
}

describe('app/api/me/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    fetchTopGenresMock.mockResolvedValue({ games: ['RPG', 'Action'] });
  });

  it('GET returns user profile with category_profile and genre_affinity', async () => {
    const supabase = makeSupabase();
    createRouteHandlerClientMock.mockResolvedValue(supabase);

    const res = await GET(new Request('http://localhost/api/me', { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual({
      id: 'user-1',
      username: 'john',
      display_name: 'John',
      category_profile: { games: { steam_id: '123' } },
      genre_affinity: { games: ['RPG', 'Action'] },
    });
    expect(fetchTopGenresMock).toHaveBeenCalledWith(supabase, 'user-1');
  });

  it('GET returns null category_profile when category row is missing', async () => {
    const supabase = makeSupabase({ categoryProfileData: null });
    createRouteHandlerClientMock.mockResolvedValue(supabase);

    const res = await GET(new Request('http://localhost/api/me', { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.category_profile).toBeNull();
  });

  it('GET returns 500 when user profile query fails', async () => {
    const supabase = makeSupabase({ userData: null, userError: { message: 'db failed' } });
    createRouteHandlerClientMock.mockResolvedValue(supabase);

    const res = await GET(new Request('http://localhost/api/me', { method: 'GET' }));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Failed to fetch user profile' });
  });

  it('returns 405 for unsupported method with Allow header', async () => {
    const supabase = makeSupabase();
    createRouteHandlerClientMock.mockResolvedValue(supabase);

    const res = await GET(new Request('http://localhost/api/me', { method: 'PATCH' }));
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('GET');
    await expect(res.json()).resolves.toEqual({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
    });
  });

  it('maps UnauthorizedError to standardized unauthorized response', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('unauthorized'));

    const res = await GET(new Request('http://localhost/api/me', { method: 'GET' }));
    expect(res.status).toBe(API_ERRORS.UNAUTHORIZED.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.UNAUTHORIZED);
  });

  it('rethrows unexpected errors', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());
    fetchTopGenresMock.mockRejectedValueOnce(new Error('boom'));

    await expect(GET(new Request('http://localhost/api/me', { method: 'GET' }))).rejects.toThrow(
      'boom',
    );
  });
});
