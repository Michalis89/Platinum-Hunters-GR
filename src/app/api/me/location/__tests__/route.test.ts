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

import { PATCH } from '@/app/api/me/location/route';
import { UnauthorizedError } from '@/lib/api/auth';
import { API_ERRORS } from '@/lib/api/errors';

type SupabaseConfig = {
  updateData?: unknown;
  updateError?: unknown;
};

function makeSupabase(config: SupabaseConfig = {}) {
  const updateData = config.updateData ?? { location_city: 'Athens' };
  const updateError = config.updateError ?? null;

  const updateSingle = jest.fn().mockResolvedValue({ data: updateData, error: updateError });
  const updateSelect = jest.fn().mockReturnValue({ single: updateSingle });
  const updateEq = jest.fn().mockReturnValue({ select: updateSelect });
  const update = jest.fn().mockReturnValue({ eq: updateEq });

  const from = jest.fn((table: string) => {
    if (table === 'users') {
      return { update };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    from,
    spies: {
      update,
      updateEq,
      updateSelect,
      updateSingle,
    },
  };
}

describe('app/api/me/location/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('PATCH updates and returns location_city', async () => {
    const supabase = makeSupabase({ updateData: { location_city: 'Athens' } });
    createRouteHandlerClientMock.mockResolvedValue(supabase);

    const res = await PATCH(
      new Request('http://localhost/api/me/location', {
        method: 'PATCH',
        body: JSON.stringify({ location_city: 'Athens' }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: { location_city: 'Athens' } });
    expect(supabase.spies.update).toHaveBeenCalledWith({ location_city: 'Athens' });
    expect(supabase.spies.updateEq).toHaveBeenCalledWith('id', 'user-1');
  });

  it('PATCH supports nullable location_city', async () => {
    const supabase = makeSupabase({ updateData: { location_city: null } });
    createRouteHandlerClientMock.mockResolvedValue(supabase);

    const res = await PATCH(
      new Request('http://localhost/api/me/location', {
        method: 'PATCH',
        body: JSON.stringify({ location_city: null }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: { location_city: null } });
  });

  it('PATCH returns 400 for invalid JSON body', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());

    const res = await PATCH(
      new Request('http://localhost/api/me/location', {
        method: 'PATCH',
        body: '{invalid-json',
      }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: 'Invalid request body',
      code: API_ERRORS.BAD_REQUEST.code,
    });
  });

  it('PATCH returns 400 when location_city validation fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());

    const res = await PATCH(
      new Request('http://localhost/api/me/location', {
        method: 'PATCH',
        body: JSON.stringify({ location_city: 123 }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid location_city');
    expect(body.code).toBe(API_ERRORS.BAD_REQUEST.code);
    expect(body.details).toBeDefined();
  });

  it('PATCH returns 500 when update fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({ updateError: { message: 'update failed' } }),
    );

    const res = await PATCH(
      new Request('http://localhost/api/me/location', {
        method: 'PATCH',
        body: JSON.stringify({ location_city: 'Athens' }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Failed to update location' });
  });

  it('returns 405 for unsupported methods and includes Allow header', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());

    const res = await PATCH(new Request('http://localhost/api/me/location', { method: 'GET' }));
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('PATCH');
    await expect(res.json()).resolves.toEqual({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
    });
  });

  it('maps UnauthorizedError to standardized unauthorized response', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('unauthorized'));

    const res = await PATCH(new Request('http://localhost/api/me/location', { method: 'PATCH' }));
    expect(res.status).toBe(API_ERRORS.UNAUTHORIZED.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.UNAUTHORIZED);
  });

  it('rethrows unexpected errors', async () => {
    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));

    await expect(
      PATCH(
        new Request('http://localhost/api/me/location', {
          method: 'PATCH',
          body: JSON.stringify({ location_city: 'Athens' }),
          headers: { 'content-type': 'application/json' },
        }),
      ),
    ).rejects.toThrow('boom');
  });
});
