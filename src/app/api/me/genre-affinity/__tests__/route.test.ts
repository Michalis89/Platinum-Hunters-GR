/**
 * @jest-environment node
 */

import 'whatwg-fetch';

const createRouteHandlerClientMock = jest.fn();
const requireAuthMock = jest.fn();
const refreshGenreAffinityMock = jest.fn();
const fetchGenreAffinityMapMock = jest.fn();

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
  refreshGenreAffinity: (...args: unknown[]) => refreshGenreAffinityMock(...args),
  fetchGenreAffinityMap: (...args: unknown[]) => fetchGenreAffinityMapMock(...args),
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

import { GET, POST } from '@/app/api/me/genre-affinity/route';
import { UnauthorizedError } from '@/lib/api/auth';
import { API_ERRORS } from '@/lib/api/errors';

type SupabaseConfig = {
  rows?: unknown[] | null;
  selectError?: unknown;
};

function makeSupabase(config: SupabaseConfig = {}) {
  const rows =
    config.rows === undefined ? [{ category: 'games', genre: 'RPG', score: 10 }] : config.rows;
  const selectError = config.selectError ?? null;

  const selectOrder = jest.fn().mockResolvedValue({ data: rows, error: selectError });
  const selectEq = jest.fn().mockReturnValue({ order: selectOrder });
  const select = jest.fn().mockReturnValue({ eq: selectEq });

  const from = jest.fn((table: string) => {
    if (table === 'user_genre_affinity') {
      return { select };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return { from, spies: { selectOrder } };
}

describe('app/api/me/genre-affinity/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    refreshGenreAffinityMock.mockResolvedValue(undefined);
    fetchGenreAffinityMapMock.mockResolvedValue({ games: ['RPG'] });
  });

  it('GET returns affinity rows', async () => {
    const supabase = makeSupabase({
      rows: [
        {
          category: 'games',
          genre: 'RPG',
          score: 10,
          item_count: 5,
          strong_signal_count: 2,
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase);

    const res = await GET(new Request('http://localhost/api/me/genre-affinity', { method: 'GET' }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: [
        {
          category: 'games',
          genre: 'RPG',
          score: 10,
          item_count: 5,
          strong_signal_count: 2,
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
  });

  it('GET returns empty array when query returns null data', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase({ rows: null }));

    const res = await GET(new Request('http://localhost/api/me/genre-affinity', { method: 'GET' }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: [] });
  });

  it('GET returns 500 when affinity query fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({ selectError: { message: 'query failed' }, rows: null }),
    );

    const res = await GET(new Request('http://localhost/api/me/genre-affinity', { method: 'GET' }));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Failed to fetch genre affinity' });
  });

  it('POST recomputes affinity and returns fresh map', async () => {
    const supabase = makeSupabase();
    createRouteHandlerClientMock.mockResolvedValue(supabase);
    fetchGenreAffinityMapMock.mockResolvedValueOnce({
      games: ['RPG', 'Action'],
      movies: ['Drama'],
    });

    const res = await POST(
      new Request('http://localhost/api/me/genre-affinity', { method: 'POST' }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: {
        affinity: { games: ['RPG', 'Action'], movies: ['Drama'] },
        message: 'Genre affinity recomputed successfully',
      },
    });
    expect(refreshGenreAffinityMock).toHaveBeenCalledWith(supabase, 'user-1');
    expect(fetchGenreAffinityMapMock).toHaveBeenCalledWith(supabase, 'user-1');
  });

  it('returns 405 for unsupported methods and includes Allow header', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());

    const res = await GET(new Request('http://localhost/api/me/genre-affinity', { method: 'PUT' }));
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('GET, POST');
    await expect(res.json()).resolves.toEqual({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
    });
  });

  it('maps UnauthorizedError to standardized unauthorized response', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('unauthorized'));

    const res = await GET(new Request('http://localhost/api/me/genre-affinity', { method: 'GET' }));
    expect(res.status).toBe(API_ERRORS.UNAUTHORIZED.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.UNAUTHORIZED);
  });

  it('rethrows unexpected errors', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());
    refreshGenreAffinityMock.mockRejectedValueOnce(new Error('boom'));

    await expect(
      POST(new Request('http://localhost/api/me/genre-affinity', { method: 'POST' })),
    ).rejects.toThrow('boom');
  });
});
