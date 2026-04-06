/**
 * @jest-environment node
 */

import 'whatwg-fetch';

const createRouteHandlerClientMock = jest.fn();
const createSupabaseAdminClientMock = jest.fn();

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

import { POST } from '@/app/api/notifications/events/route';

function makeRouteClient(session: unknown) {
  return {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session },
      }),
    },
  };
}

function makeAdminClient(insertResult: { error: unknown }) {
  const insert = jest.fn().mockResolvedValue(insertResult);
  const from = jest.fn().mockReturnValue({ insert });
  return { from, spies: { insert } };
}

describe('app/api/notifications/events/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 405 for non-POST methods with Allow header', async () => {
    const res = await POST(
      new Request('http://localhost/api/notifications/events', { method: 'GET' }),
    );

    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('POST');
    await expect(res.json()).resolves.toEqual({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
    });
  });

  it('returns 400 for invalid JSON payload', async () => {
    const res = await POST(
      new Request('http://localhost/api/notifications/events', {
        method: 'POST',
        body: '{bad-json',
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: 'Invalid notification event payload',
      code: 'BAD_REQUEST',
    });
  });

  it('returns 400 for schema-invalid payload', async () => {
    const res = await POST(
      new Request('http://localhost/api/notifications/events', {
        method: 'POST',
        body: JSON.stringify({
          notificationId: '',
          action: 'invalid-action',
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: 'Invalid notification event payload',
      code: 'BAD_REQUEST',
    });
  });

  it('returns tracked:false when there is no authenticated session', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient(null));

    const res = await POST(
      new Request('http://localhost/api/notifications/events', {
        method: 'POST',
        body: JSON.stringify({
          notificationId: 'notif-1',
          action: 'received',
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: { tracked: false } });
  });

  it('returns 500 when insert fails (with explicit error message)', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient({ user: { id: 'user-1' } }));
    const admin = makeAdminClient({ error: { message: 'insert failed' } });
    createSupabaseAdminClientMock.mockReturnValue(admin);

    const res = await POST(
      new Request('http://localhost/api/notifications/events', {
        method: 'POST',
        body: JSON.stringify({
          notificationId: 'notif-1',
          action: 'open',
          route: '/dashboard',
          platform: 'web',
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: 'insert failed',
      code: 'TRACK_FAILED',
    });
    expect(admin.spies.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      notification_id: 'notif-1',
      action: 'open',
      route: '/dashboard',
      platform: 'web',
    });
  });

  it('returns 500 with fallback message when insert error has no message', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient({ user: { id: 'user-1' } }));
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient({ error: {} }));

    const res = await POST(
      new Request('http://localhost/api/notifications/events', {
        method: 'POST',
        body: JSON.stringify({
          notificationId: 'notif-2',
          action: 'dismiss',
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: 'Failed to track notification event',
      code: 'TRACK_FAILED',
    });
  });

  it('returns tracked:true on successful insert and normalizes optional fields to null', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient({ user: { id: 'user-1' } }));
    const admin = makeAdminClient({ error: null });
    createSupabaseAdminClientMock.mockReturnValue(admin);

    const res = await POST(
      new Request('http://localhost/api/notifications/events', {
        method: 'POST',
        body: JSON.stringify({
          notificationId: 'notif-3',
          action: 'received',
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: { tracked: true } });
    expect(admin.spies.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      notification_id: 'notif-3',
      action: 'received',
      route: null,
      platform: null,
    });
  });
});
