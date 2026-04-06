/**
 * @jest-environment node
 */

import 'whatwg-fetch';

const createRouteHandlerClientMock = jest.fn();
const requireAuthMock = jest.fn();
const getSupabaseServerMock = jest.fn();

jest.mock('next/server', () => ({
  __esModule: true,
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
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

jest.mock('@/lib/supabase-server', () => ({
  __esModule: true,
  default: (...args: unknown[]) => getSupabaseServerMock(...args),
}));

import { GET, POST, DELETE } from '@/app/api/me/share-token/route';
import { UnauthorizedError } from '@/lib/api/auth';

type DbConfig = {
  getData?: unknown;
  getReject?: unknown;
  postData?: unknown;
  postError?: unknown;
  postReject?: unknown;
  deleteReject?: unknown;
};

function makeDb(config: DbConfig = {}) {
  const getData = config.getData ?? null;
  const hasPostData = Object.prototype.hasOwnProperty.call(config, 'postData');
  const postData = hasPostData
    ? config.postData
    : {
        token: 'abc123',
        created_at: '2026-01-01T00:00:00.000Z',
        expires_at: null,
      };
  const postError = config.postError ?? null;

  const getMaybeSingle = config.getReject
    ? jest.fn().mockRejectedValue(config.getReject)
    : jest.fn().mockResolvedValue({ data: getData });
  const getEq = jest.fn().mockReturnValue({ maybeSingle: getMaybeSingle });
  const getSelect = jest.fn().mockReturnValue({ eq: getEq });

  const postSingle = config.postReject
    ? jest.fn().mockRejectedValue(config.postReject)
    : jest.fn().mockResolvedValue({ data: postData, error: postError });
  const postSelect = jest.fn().mockReturnValue({ single: postSingle });
  const postUpsert = jest.fn().mockReturnValue({ select: postSelect });

  const deleteEq = config.deleteReject
    ? jest.fn().mockRejectedValue(config.deleteReject)
    : jest.fn().mockResolvedValue({ error: null });
  const deleteFn = jest.fn().mockReturnValue({ eq: deleteEq });

  const from = jest.fn((table: string) => {
    if (table !== 'share_tokens') {
      throw new Error(`Unexpected table: ${table}`);
    }
    return {
      select: getSelect,
      upsert: postUpsert,
      delete: deleteFn,
    };
  });

  return {
    from,
    spies: {
      getMaybeSingle,
      postUpsert,
      postSingle,
      deleteEq,
    },
  };
}

describe('app/api/me/share-token/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createRouteHandlerClientMock.mockResolvedValue({ from: jest.fn() });
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    const randomBytes = new Uint8Array(Array.from({ length: 16 }, (_, i) => i + 1));
    jest.spyOn(global.crypto, 'getRandomValues').mockImplementation((arr: Uint8Array) => {
      arr.set(randomBytes);
      return arr;
    });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('GET returns null token payload when no row exists', async () => {
    getSupabaseServerMock.mockReturnValue(makeDb({ getData: null }));

    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      token: null,
      createdAt: null,
      expiresAt: null,
    });
  });

  it('GET returns token payload when row exists', async () => {
    getSupabaseServerMock.mockReturnValue(
      makeDb({
        getData: {
          token: 'tok-1',
          created_at: '2026-01-01T00:00:00.000Z',
          expires_at: '2026-01-08T00:00:00.000Z',
        },
      }),
    );

    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      token: 'tok-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-01-08T00:00:00.000Z',
    });
  });

  it('GET maps UnauthorizedError to 401', async () => {
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('unauthorized'));
    getSupabaseServerMock.mockReturnValue(makeDb());

    const res = await GET();
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('GET returns 500 on unexpected errors', async () => {
    getSupabaseServerMock.mockReturnValue(makeDb({ getReject: new Error('db fail') }));

    const res = await GET();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Server error' });
  });

  it('POST returns 400 for invalid expiresInDays', async () => {
    getSupabaseServerMock.mockReturnValue(makeDb());

    const res = await POST(
      new Request('http://localhost/api/me/share-token', {
        method: 'POST',
        body: JSON.stringify({ expiresInDays: 15 }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid expiresInDays value' });
  });

  it('POST creates non-expiring token when body is invalid JSON', async () => {
    const db = makeDb({
      postData: {
        token: 'generated-1',
        created_at: '2026-01-01T00:00:00.000Z',
        expires_at: null,
      },
    });
    getSupabaseServerMock.mockReturnValue(db);

    const res = await POST(
      new Request('http://localhost/api/me/share-token', {
        method: 'POST',
        body: '{bad-json',
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      token: 'generated-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: null,
    });

    const upsertPayload = db.spies.postUpsert.mock.calls[0][0];
    expect(upsertPayload.user_id).toBe('user-1');
    expect(upsertPayload.token).toMatch(/^[0-9a-f]{32}$/);
    expect(upsertPayload.expires_at).toBeNull();
  });

  it('POST supports expiresInDays 7 and 30', async () => {
    const db = makeDb({
      postData: {
        token: 'generated-2',
        created_at: '2026-01-01T00:00:00.000Z',
        expires_at: '2026-01-08T00:00:00.000Z',
      },
    });
    getSupabaseServerMock.mockReturnValue(db);

    let res = await POST(
      new Request('http://localhost/api/me/share-token', {
        method: 'POST',
        body: JSON.stringify({ expiresInDays: 7 }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(200);
    let upsertPayload = db.spies.postUpsert.mock.calls[0][0];
    expect(typeof upsertPayload.expires_at).toBe('string');

    res = await POST(
      new Request('http://localhost/api/me/share-token', {
        method: 'POST',
        body: JSON.stringify({ expiresInDays: 30 }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(200);
    upsertPayload = db.spies.postUpsert.mock.calls[1][0];
    expect(typeof upsertPayload.expires_at).toBe('string');
  });

  it('POST returns 500 when upsert returns error or empty data', async () => {
    getSupabaseServerMock.mockReturnValue(makeDb({ postError: { message: 'upsert failed' } }));
    let res = await POST(
      new Request('http://localhost/api/me/share-token', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Server error' });

    getSupabaseServerMock.mockReturnValue(makeDb({ postData: null, postError: null }));
    res = await POST(
      new Request('http://localhost/api/me/share-token', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(500);
  });

  it('POST maps UnauthorizedError to 401 and unexpected errors to 500', async () => {
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('unauthorized'));
    getSupabaseServerMock.mockReturnValue(makeDb());
    let res = await POST(
      new Request('http://localhost/api/me/share-token', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Unauthorized' });

    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    getSupabaseServerMock.mockReturnValue(makeDb({ postReject: new Error('boom') }));
    res = await POST(
      new Request('http://localhost/api/me/share-token', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Server error' });
  });

  it('DELETE revokes token and returns success', async () => {
    const db = makeDb();
    getSupabaseServerMock.mockReturnValue(db);

    const res = await DELETE();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
    expect(db.spies.deleteEq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('DELETE maps UnauthorizedError and handles server errors', async () => {
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('unauthorized'));
    getSupabaseServerMock.mockReturnValue(makeDb());

    let res = await DELETE();
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Unauthorized' });

    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    getSupabaseServerMock.mockReturnValue(makeDb({ deleteReject: new Error('delete failed') }));
    res = await DELETE();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Server error' });
  });
});
