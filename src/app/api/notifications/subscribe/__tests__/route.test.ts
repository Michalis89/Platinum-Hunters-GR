/**
 * @jest-environment node
 */

import 'whatwg-fetch';

const createRouteHandlerClientMock = jest.fn();
const createSupabaseAdminClientMock = jest.fn();
const requireAuthMock = jest.fn();

jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: (...args: unknown[]) => createRouteHandlerClientMock(...args),
}));

jest.mock('@/lib/supabase/admin', () => ({
  __esModule: true,
  createSupabaseAdminClient: (...args: unknown[]) => createSupabaseAdminClientMock(...args),
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

import { POST, DELETE } from '@/app/api/notifications/subscribe/route';
import { API_ERRORS } from '@/lib/api/errors';
import { UnauthorizedError } from '@/lib/api/auth';

function makeAdminClient({ upsertError = null as unknown, deleteError = null as unknown } = {}) {
  const upsert = jest.fn().mockResolvedValue({ error: upsertError });
  const deleteEq2 = jest.fn().mockResolvedValue({ error: deleteError });
  const deleteEq1 = jest.fn().mockReturnValue({ eq: deleteEq2 });
  const del = jest.fn().mockReturnValue({ eq: deleteEq1 });

  const from = jest.fn((table: string) => {
    if (table !== 'push_subscriptions') {
      throw new Error(`Unexpected table: ${table}`);
    }
    return {
      upsert,
      delete: del,
    };
  });

  return { from, spies: { upsert, del, deleteEq1, deleteEq2 } };
}

describe('app/api/notifications/subscribe/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createRouteHandlerClientMock.mockResolvedValue({ auth: {} });
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('returns 405 for unsupported method with Allow header', async () => {
    const res = await POST(
      new Request('http://localhost/api/notifications/subscribe', { method: 'GET' }),
    );
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('POST, DELETE');
    await expect(res.json()).resolves.toEqual({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
    });
  });

  it('maps UnauthorizedError to standardized unauthorized response', async () => {
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('unauthorized'));

    const res = await POST(
      new Request('http://localhost/api/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(API_ERRORS.UNAUTHORIZED.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.UNAUTHORIZED);
  });

  it('rethrows unknown errors from handler', async () => {
    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));

    await expect(
      POST(
        new Request('http://localhost/api/notifications/subscribe', {
          method: 'POST',
          body: JSON.stringify({}),
        }),
      ),
    ).rejects.toThrow('boom');
  });

  it('POST returns 400 for invalid payload (bad json and schema invalid)', async () => {
    let res = await POST(
      new Request('http://localhost/api/notifications/subscribe', {
        method: 'POST',
        body: '{bad-json',
      }),
    );
    expect(res.status).toBe(API_ERRORS.BAD_REQUEST.status);
    await expect(res.json()).resolves.toEqual({
      error: 'Invalid push subscription payload',
      code: API_ERRORS.BAD_REQUEST.code,
    });

    res = await POST(
      new Request('http://localhost/api/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          subscription: {
            endpoint: 'not-a-url',
            expirationTime: null,
            keys: { p256dh: '', auth: '' },
          },
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(API_ERRORS.BAD_REQUEST.status);
  });

  it('POST returns 500 on upsert error (message and fallback)', async () => {
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({ upsertError: { message: 'upsert failed' } }),
    );

    let res = await POST(
      new Request('http://localhost/api/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          subscription: {
            endpoint: 'https://push.example/sub/1',
            expirationTime: null,
            keys: { p256dh: 'p', auth: 'a' },
          },
          userAgent: 'UA',
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: 'upsert failed',
      code: 'PUSH_SUBSCRIBE_FAILED',
    });

    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient({ upsertError: {} }));
    res = await POST(
      new Request('http://localhost/api/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          subscription: {
            endpoint: 'https://push.example/sub/1',
            expirationTime: null,
            keys: { p256dh: 'p', auth: 'a' },
          },
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: 'Failed to store push subscription',
      code: 'PUSH_SUBSCRIBE_FAILED',
    });
  });

  it('POST succeeds and normalizes optional userAgent to null', async () => {
    const admin = makeAdminClient();
    createSupabaseAdminClientMock.mockReturnValue(admin);

    const res = await POST(
      new Request('http://localhost/api/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          subscription: {
            endpoint: 'https://push.example/sub/2',
            expirationTime: 0,
            keys: { p256dh: 'p', auth: 'a' },
          },
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: { subscribed: true } });
    expect(admin.spies.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        endpoint: 'https://push.example/sub/2',
        user_agent: null,
      }),
      { onConflict: 'user_id,endpoint' },
    );
  });

  it('DELETE returns 400 for invalid payload (bad json and schema invalid)', async () => {
    let res = await DELETE(
      new Request('http://localhost/api/notifications/subscribe', {
        method: 'DELETE',
        body: '{bad-json',
      }),
    );
    expect(res.status).toBe(API_ERRORS.BAD_REQUEST.status);
    await expect(res.json()).resolves.toEqual({
      error: 'Invalid unsubscribe payload',
      code: API_ERRORS.BAD_REQUEST.code,
    });

    res = await DELETE(
      new Request('http://localhost/api/notifications/subscribe', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint: 'not-a-url' }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(API_ERRORS.BAD_REQUEST.status);
  });

  it('DELETE returns 500 on delete error (message and fallback)', async () => {
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({ deleteError: { message: 'delete failed' } }),
    );

    let res = await DELETE(
      new Request('http://localhost/api/notifications/subscribe', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint: 'https://push.example/sub/3' }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: 'delete failed',
      code: 'PUSH_UNSUBSCRIBE_FAILED',
    });

    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient({ deleteError: {} }));
    res = await DELETE(
      new Request('http://localhost/api/notifications/subscribe', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint: 'https://push.example/sub/3' }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: 'Failed to remove push subscription',
      code: 'PUSH_UNSUBSCRIBE_FAILED',
    });
  });

  it('DELETE succeeds and filters by user_id and endpoint', async () => {
    const admin = makeAdminClient();
    createSupabaseAdminClientMock.mockReturnValue(admin);

    const res = await DELETE(
      new Request('http://localhost/api/notifications/subscribe', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint: 'https://push.example/sub/4' }),
        headers: { 'content-type': 'application/json' },
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: { subscribed: false } });
    expect(admin.spies.deleteEq1).toHaveBeenCalledWith('user_id', 'user-1');
    expect(admin.spies.deleteEq2).toHaveBeenCalledWith('endpoint', 'https://push.example/sub/4');
  });
});
