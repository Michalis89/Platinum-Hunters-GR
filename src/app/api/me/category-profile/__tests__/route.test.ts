/**
 * @jest-environment node
 */

import 'whatwg-fetch';

const createRouteHandlerClientMock = jest.fn();
const requireAuthMock = jest.fn();

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

import { GET, PUT } from '@/app/api/me/category-profile/route';
import { UnauthorizedError } from '@/lib/api/auth';
import { API_ERRORS } from '@/lib/api/errors';

type SupabaseConfig = {
  getData?: unknown;
  getError?: unknown;
  upsertData?: unknown;
  upsertError?: unknown;
};

function makeSupabase(config: SupabaseConfig = {}) {
  const getData = Object.prototype.hasOwnProperty.call(config, 'getData')
    ? config.getData
    : {
        profiles: { games: { steam_id: 'steam-1' } },
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
      };
  const getError = config.getError ?? null;
  const upsertData = config.upsertData ?? {
    user_id: 'user-1',
    profiles: { games: { steam_id: 'updated' } },
  };
  const upsertError = config.upsertError ?? null;

  const getMaybeSingle = jest.fn().mockResolvedValue({ data: getData, error: getError });
  const getEq = jest.fn().mockReturnValue({ maybeSingle: getMaybeSingle });
  const getSelect = jest.fn().mockReturnValue({ eq: getEq });

  const upsertSingle = jest.fn().mockResolvedValue({ data: upsertData, error: upsertError });
  const upsertSelect = jest.fn().mockReturnValue({ single: upsertSingle });
  const upsert = jest.fn().mockReturnValue({ select: upsertSelect });

  const from = jest.fn((table: string) => {
    if (table === 'user_category_profiles') {
      return { select: getSelect, upsert };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    from,
    spies: {
      getMaybeSingle,
      upsert,
      upsertSingle,
    },
  };
}

describe('app/api/me/category-profile/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('GET returns category profile row', async () => {
    const supabase = makeSupabase();
    createRouteHandlerClientMock.mockResolvedValue(supabase);

    const res = await GET(
      new Request('http://localhost/api/me/category-profile', { method: 'GET' }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: {
        profiles: { games: { steam_id: 'steam-1' } },
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
      },
    });
  });

  it('GET returns empty profile payload when row does not exist', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase({ getData: null }));

    const res = await GET(
      new Request('http://localhost/api/me/category-profile', { method: 'GET' }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: {
        profiles: {},
        created_at: null,
        updated_at: null,
      },
    });
  });

  it('GET returns 500 when query fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({ getError: { message: 'select failed' }, getData: null }),
    );

    const res = await GET(
      new Request('http://localhost/api/me/category-profile', { method: 'GET' }),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Failed to fetch category profile' });
  });

  it('PUT returns 400 for invalid JSON body', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());

    const res = await PUT(
      new Request('http://localhost/api/me/category-profile', {
        method: 'PUT',
        body: '{invalid-json',
      }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: 'Invalid request body',
      code: API_ERRORS.BAD_REQUEST.code,
    });
  });

  it('PUT returns 400 when schema validation fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());

    const res = await PUT(
      new Request('http://localhost/api/me/category-profile', {
        method: 'PUT',
        body: JSON.stringify({ games: { gaming_since: 'not-a-number' } }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid category profile payload');
    expect(body.code).toBe(API_ERRORS.BAD_REQUEST.code);
    expect(body.details).toBeDefined();
  });

  it('PUT upserts and returns updated row on valid payload', async () => {
    const supabase = makeSupabase({
      upsertData: {
        user_id: 'user-1',
        profiles: { games: { steam_id: 'steam-new' } },
      },
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase);

    const payload = {
      games: {
        steam_id: 'steam-new',
      },
    };
    const res = await PUT(
      new Request('http://localhost/api/me/category-profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: {
        user_id: 'user-1',
        profiles: { games: { steam_id: 'steam-new' } },
      },
    });
    expect(supabase.spies.upsert).toHaveBeenCalledWith(
      {
        user_id: 'user-1',
        profiles: payload,
      },
      { onConflict: 'user_id' },
    );
  });

  it('PUT returns 500 when upsert fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({ upsertError: { message: 'upsert failed' } }),
    );

    const res = await PUT(
      new Request('http://localhost/api/me/category-profile', {
        method: 'PUT',
        body: JSON.stringify({ games: { steam_id: 'steam-1' } }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Failed to update category profile' });
  });

  it('returns 405 for unsupported methods and includes Allow header', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());

    const res = await GET(
      new Request('http://localhost/api/me/category-profile', { method: 'POST' }),
    );
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('GET, PUT');
    await expect(res.json()).resolves.toEqual({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
    });
  });

  it('maps UnauthorizedError to standardized unauthorized response', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('unauthorized'));

    const res = await GET(
      new Request('http://localhost/api/me/category-profile', { method: 'GET' }),
    );
    expect(res.status).toBe(API_ERRORS.UNAUTHORIZED.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.UNAUTHORIZED);
  });

  it('rethrows unexpected errors', async () => {
    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));

    await expect(
      GET(new Request('http://localhost/api/me/category-profile', { method: 'GET' })),
    ).rejects.toThrow('boom');
  });
});
