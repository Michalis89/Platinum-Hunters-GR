/**
 * @jest-environment node
 */

import 'whatwg-fetch';

const createRouteHandlerClientMock = jest.fn();
const createSupabaseAdminClientMock = jest.fn();
const requireAdminRoleMock = jest.fn();

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

jest.mock('@/lib/api/permissions', () => {
  class MockForbiddenError extends Error {
    code: string;
    constructor(message = 'Forbidden', code = 'FORBIDDEN') {
      super(message);
      this.code = code;
    }
  }
  return {
    __esModule: true,
    requireAdminRole: (...args: unknown[]) => requireAdminRoleMock(...args),
    ForbiddenError: MockForbiddenError,
  };
});

jest.mock('@/lib/api/auth', () => ({
  __esModule: true,
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

import { POST } from '@/app/api/notifications/send/route';
import { API_ERRORS } from '@/lib/api/errors';
import { UnauthorizedError } from '@/lib/api/auth';
import { ForbiddenError } from '@/lib/api/permissions';

type QueryResult = { data: unknown[] | null; error: { message?: string } | null };

function makeAdminClient({
  defaultResult = { data: [], error: null } as QueryResult,
  eqResult,
}: {
  defaultResult?: QueryResult;
  eqResult?: QueryResult;
} = {}) {
  const query = {
    eq: jest.fn().mockResolvedValue(eqResult ?? defaultResult),
    then: (resolve: (value: QueryResult) => unknown) => resolve(defaultResult),
  };
  const select = jest.fn().mockReturnValue(query);
  const from = jest.fn().mockReturnValue({ select });
  return { from, spies: { select, query } };
}

describe('app/api/notifications/send/route', () => {
  const originalPushEdgeUrl = process.env.PUSH_EDGE_FUNCTION_URL;
  const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    createRouteHandlerClientMock.mockResolvedValue({ auth: {} });
    requireAdminRoleMock.mockResolvedValue(undefined);
    process.env.PUSH_EDGE_FUNCTION_URL =
      'https://explicit.example/functions/v1/send-push-notification';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fallback.example';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    process.env.PUSH_EDGE_FUNCTION_URL = originalPushEdgeUrl;
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey;
  });

  it('returns 405 for non-POST methods with Allow header', async () => {
    const res = await POST(
      new Request('http://localhost/api/notifications/send', { method: 'GET' }),
    );
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('POST');
    await expect(res.json()).resolves.toEqual({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
    });
  });

  it('maps UnauthorizedError and ForbiddenError from requireAdminRole', async () => {
    requireAdminRoleMock.mockRejectedValueOnce(new UnauthorizedError('unauthorized'));
    let res = await POST(
      new Request('http://localhost/api/notifications/send', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(API_ERRORS.UNAUTHORIZED.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.UNAUTHORIZED);

    requireAdminRoleMock.mockRejectedValueOnce(new ForbiddenError('Nope', 'FORBIDDEN_ADMIN'));
    res = await POST(
      new Request('http://localhost/api/notifications/send', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: 'Nope',
      code: 'FORBIDDEN_ADMIN',
    });
  });

  it('returns 400 for invalid payload (bad json and schema invalid)', async () => {
    let res = await POST(
      new Request('http://localhost/api/notifications/send', {
        method: 'POST',
        body: '{bad-json',
      }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: 'Invalid send payload',
      code: API_ERRORS.BAD_REQUEST.code,
    });

    res = await POST(
      new Request('http://localhost/api/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          notificationId: '',
          title: '',
          body: '',
          url: 'not-empty',
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 500 when required push env vars are missing', async () => {
    process.env.PUSH_EDGE_FUNCTION_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';

    const res = await POST(
      new Request('http://localhost/api/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          notificationId: 'notif-1',
          title: 'Hello',
          body: 'World',
          url: '/u/test',
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error:
        'Missing PUSH_EDGE_FUNCTION_URL (or NEXT_PUBLIC_SUPABASE_URL) / SUPABASE_SERVICE_ROLE_KEY',
      code: 'MISSING_PUSH_ENV',
    });
  });

  it('returns 500 when subscriptions query fails (message and fallback)', async () => {
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({
        defaultResult: { data: null, error: { message: 'db failed' } },
      }),
    );

    let res = await POST(
      new Request('http://localhost/api/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          notificationId: 'notif-2',
          title: 'Hello',
          body: 'World',
          url: '/u/test',
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: 'db failed',
      code: 'SUBS_FETCH_FAILED',
    });

    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({
        defaultResult: { data: null, error: {} },
      }),
    );
    res = await POST(
      new Request('http://localhost/api/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          notificationId: 'notif-2b',
          title: 'Hello',
          body: 'World',
          url: '/u/test',
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: 'Failed to fetch subscriptions',
      code: 'SUBS_FETCH_FAILED',
    });
  });

  it('returns zero counts when no subscriptions are found', async () => {
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({
        defaultResult: { data: [], error: null },
      }),
    );

    const res = await POST(
      new Request('http://localhost/api/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          notificationId: 'notif-3',
          title: 'Hello',
          body: 'World',
          url: '/u/test',
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: { sent: 0, failed: 0, total: 0 },
    });
  });

  it('sends notifications using explicit edge URL and reports sent/failed counts', async () => {
    const subscriptions = [
      { user_id: 'u1', endpoint: 'e1', subscription: { k: 1 } },
      { user_id: 'u2', endpoint: 'e2', subscription: { k: 2 } },
    ];
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({
        defaultResult: { data: subscriptions, error: null },
      }),
    );
    fetchSpy
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: 'edge fail' }),
      } as Response);

    const res = await POST(
      new Request('http://localhost/api/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          notificationId: 'notif-4',
          title: 'Title',
          body: 'Body',
          url: '/u/test',
          icon: '/icon.png',
          badge: '/badge.png',
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: { sent: 1, failed: 1, total: 2 },
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://explicit.example/functions/v1/send-push-notification',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer service-role-key',
        }),
      }),
    );
  });

  it('uses fallback supabase URL and userId filtering, and handles non-json edge failure payload', async () => {
    process.env.PUSH_EDGE_FUNCTION_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fallback.example';

    const subscriptions = [{ user_id: 'u1', endpoint: 'e1', subscription: { k: 1 } }];
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({
        defaultResult: { data: [], error: null },
        eqResult: { data: subscriptions, error: null },
      }),
    );
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('non-json');
      },
    } as unknown as Response);

    const res = await POST(
      new Request('http://localhost/api/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          notificationId: 'notif-5',
          title: 'Title',
          body: 'Body',
          url: '/u/test',
          userId: '123e4567-e89b-12d3-a456-426614174000',
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: { sent: 0, failed: 1, total: 1 },
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://fallback.example/functions/v1/send-push-notification',
      expect.any(Object),
    );
  });

  it('rethrows unknown errors from handler', async () => {
    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));

    await expect(
      POST(
        new Request('http://localhost/api/notifications/send', {
          method: 'POST',
          body: JSON.stringify({
            notificationId: 'notif-6',
            title: 'Title',
            body: 'Body',
            url: '/u/test',
          }),
          headers: { 'content-type': 'application/json' },
        }),
      ),
    ).rejects.toThrow('boom');
  });
});
