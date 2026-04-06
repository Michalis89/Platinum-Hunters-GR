/**
 * @jest-environment node
 */

import 'whatwg-fetch';

const createRouteHandlerClientMock = jest.fn();
const requireAuthMock = jest.fn();
const getUserSettingsMock = jest.fn();
const updateUserSettingsMock = jest.fn();

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

jest.mock('@/lib/settings', () => ({
  __esModule: true,
  getUserSettings: (...args: unknown[]) => getUserSettingsMock(...args),
  updateUserSettings: (...args: unknown[]) => updateUserSettingsMock(...args),
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

import { GET, PATCH } from '@/app/api/settings/route';
import { API_ERRORS } from '@/lib/api/errors';
import { UnauthorizedError } from '@/lib/api/auth';

describe('app/api/settings/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createRouteHandlerClientMock.mockResolvedValue({ tag: 'supabase' });
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    getUserSettingsMock.mockResolvedValue({ theme: 'dark' });
    updateUserSettingsMock.mockResolvedValue({ theme: 'light' });
  });

  it('GET returns user settings', async () => {
    const res = await GET(new Request('http://localhost/api/settings', { method: 'GET' }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: { theme: 'dark' } });
    expect(getUserSettingsMock).toHaveBeenCalledWith('user-1', { supabase: { tag: 'supabase' } });
  });

  it('PATCH updates settings with valid payload', async () => {
    const res = await PATCH(
      new Request('http://localhost/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({ theme: 'light', dnd_role: null }),
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: { theme: 'light' } });
    expect(updateUserSettingsMock).toHaveBeenCalledWith(
      'user-1',
      { theme: 'light', dnd_role: null },
      { supabase: { tag: 'supabase' } },
    );
  });

  it('PATCH returns bad request for invalid JSON body', async () => {
    const req = {
      method: 'PATCH',
      json: async () => {
        throw new Error('bad json');
      },
    } as unknown as Request;

    const res = await PATCH(req);
    expect(res.status).toBe(API_ERRORS.BAD_REQUEST.status);
    await expect(res.json()).resolves.toEqual({
      error: 'Invalid request body',
      code: API_ERRORS.BAD_REQUEST.code,
    });
  });

  it('PATCH returns bad request for invalid payload schema', async () => {
    const res = await PATCH(
      new Request('http://localhost/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({ theme: 'neon', social_enabled: 'yes' }),
      }),
    );

    expect(res.status).toBe(API_ERRORS.BAD_REQUEST.status);
    await expect(res.json()).resolves.toEqual({
      error: 'Invalid settings payload',
      code: API_ERRORS.BAD_REQUEST.code,
    });
  });

  it('returns 405 with Allow header for unsupported methods', async () => {
    const res = await PATCH(new Request('http://localhost/api/settings', { method: 'POST' }));
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('GET, PATCH');
    await expect(res.json()).resolves.toEqual({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
    });
  });

  it('returns unauthorized when auth fails with UnauthorizedError', async () => {
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('nope'));
    const res = await GET(new Request('http://localhost/api/settings', { method: 'GET' }));
    expect(res.status).toBe(API_ERRORS.UNAUTHORIZED.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.UNAUTHORIZED);
  });

  it('rethrows non-unauthorized errors', async () => {
    requireAuthMock.mockRejectedValueOnce(new Error('boom'));
    await expect(
      GET(new Request('http://localhost/api/settings', { method: 'GET' })),
    ).rejects.toThrow('boom');
  });
});
