import 'whatwg-fetch';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

const createRouteHandlerClientMock = jest.fn();
const insertActivityMock = jest.fn();
const getUserBasicInfoMock = jest.fn();
const requireAuthMock = jest.fn();
const revalidateArticleLikeMock = jest.fn();

jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

jest.mock('@/lib/supabase-route-handler', () => ({
  createRouteHandlerClient: (...args: unknown[]) => createRouteHandlerClientMock(...args),
}));

jest.mock('@/lib/services/activityService', () => ({
  insertActivity: (...args: unknown[]) => insertActivityMock(...args),
}));

jest.mock('@/lib/services/userService', () => ({
  getUserBasicInfo: (...args: unknown[]) => getUserBasicInfoMock(...args),
}));

jest.mock('@/lib/api/auth', () => ({
  UnauthorizedError: class UnauthorizedError extends Error {
    code = 'UNAUTHORIZED';
  },
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
}));

jest.mock('@/lib/cache/tags', () => ({
  revalidateCache: {
    articleLike: (...args: unknown[]) => revalidateArticleLikeMock(...args),
  },
}));

import { API_ERRORS } from '@/lib/api/errors';
import { UnauthorizedError } from '@/lib/api/auth';
import { GET, POST, DELETE } from '@/app/api/articles/[id]/like/route';

function makeClient(config?: {
  getSessionUserId?: string | null;
  likeCount?: number | null;
  likeMaybeSingleData?: unknown;
  articleSingleData?: unknown;
  articleSingleError?: unknown;
  upsertData?: unknown;
  upsertError?: unknown;
  deleteError?: unknown;
}) {
  const getSession = jest.fn().mockResolvedValue({
    data: {
      session: config?.getSessionUserId ? { user: { id: config.getSessionUserId } } : null,
    },
  });

  const countEq = jest.fn().mockResolvedValue({ count: config?.likeCount ?? 0, error: null });
  const countSelect = jest.fn().mockReturnValue({ eq: countEq });

  const maybeSingle = jest
    .fn()
    .mockResolvedValue({ data: config?.likeMaybeSingleData ?? null, error: null });
  const likeUserEq2 = jest.fn().mockReturnValue({ maybeSingle });
  const likeUserEq1 = jest.fn().mockReturnValue({ eq: likeUserEq2 });
  const likeIdSelect = jest.fn().mockReturnValue({ eq: likeUserEq1 });

  const upsertSelect = jest.fn().mockResolvedValue({
    data: config?.upsertData ?? [{ id: 1 }],
    error: config?.upsertError ?? null,
  });
  const upsert = jest.fn().mockReturnValue({ select: upsertSelect });

  const deleteEq2 = jest.fn().mockResolvedValue({ error: config?.deleteError ?? null });
  const deleteEq1 = jest.fn().mockReturnValue({ eq: deleteEq2 });
  const del = jest.fn().mockReturnValue({ eq: deleteEq1 });

  const articleSingle = jest.fn().mockResolvedValue({
    data: config?.articleSingleData ?? { id: 9, title: 'A', slug: 'a', author_id: 'author-2' },
    error: config?.articleSingleError ?? null,
  });
  const articleEq = jest.fn().mockReturnValue({ single: articleSingle });
  const articleSelect = jest.fn().mockReturnValue({ eq: articleEq });

  const from = jest.fn().mockImplementation((table: string) => {
    if (table === 'article_likes') {
      return {
        select: (columns: string, opts?: { count?: 'exact'; head?: boolean }) =>
          opts?.head ? countSelect() : likeIdSelect(),
        upsert,
        delete: del,
      };
    }
    if (table === 'articles') {
      return { select: articleSelect };
    }
    return {};
  });

  return {
    client: {
      from,
      auth: { getSession },
    },
    spies: {
      upsert,
      upsertSelect,
      del,
      deleteEq1,
      deleteEq2,
      countEq,
      maybeSingle,
    },
  };
}

describe('app/api/articles/[id]/like/route', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    getUserBasicInfoMock.mockResolvedValue({
      username: 'u',
      display_name: 'U',
      avatar_url: '/u.png',
    });
    insertActivityMock.mockResolvedValue(undefined);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('GET returns liked=false for anonymous user', async () => {
    const s = makeClient({ getSessionUserId: null, likeCount: 3 });
    createRouteHandlerClientMock.mockResolvedValue(s.client);

    const response = await GET(new Request('https://example.com'), {
      params: Promise.resolve({ id: '9' }),
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: { liked: false, count: 3 } });
  });

  it('GET anonymous falls back count to 0 when count is null', async () => {
    const s = makeClient({ getSessionUserId: null, likeCount: null });
    createRouteHandlerClientMock.mockResolvedValue(s.client);

    const response = await GET(new Request('https://example.com'), {
      params: Promise.resolve({ id: '9' }),
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: { liked: false, count: 0 } });
  });

  it('GET returns liked status for authenticated user and handles count fallback', async () => {
    const s = makeClient({
      getSessionUserId: 'user-1',
      likeCount: null,
      likeMaybeSingleData: { id: 2 },
    });
    createRouteHandlerClientMock.mockResolvedValue(s.client);

    const response = await GET(new Request('https://example.com'), {
      params: Promise.resolve({ id: '9' }),
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: { liked: true, count: 0 } });
  });

  it('GET handles unexpected errors as internal', async () => {
    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));
    const response = await GET(new Request('https://example.com'), {
      params: Promise.resolve({ id: '9' }),
    });
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
  });

  it('POST maps unauthorized errors', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeClient().client);
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError());
    const response = await POST(new Request('https://example.com', { method: 'POST' }), {
      params: Promise.resolve({ id: '9' }),
    });
    expect(response.status).toBe(API_ERRORS.UNAUTHORIZED.status);
  });

  it('POST returns 404 when article is missing', async () => {
    const s = makeClient({ articleSingleData: null, articleSingleError: { message: 'nf' } });
    createRouteHandlerClientMock.mockResolvedValue(s.client);
    const response = await POST(new Request('https://example.com', { method: 'POST' }), {
      params: Promise.resolve({ id: '9' }),
    });
    expect(response.status).toBe(404);
  });

  it('POST blocks self-like', async () => {
    const s = makeClient({
      articleSingleData: { id: 9, title: 'A', slug: 'a', author_id: 'user-1' },
    });
    createRouteHandlerClientMock.mockResolvedValue(s.client);
    const response = await POST(new Request('https://example.com', { method: 'POST' }), {
      params: Promise.resolve({ id: '9' }),
    });
    expect(response.status).toBe(403);
  });

  it('POST handles insert failure and duplicate-like conflict', async () => {
    const s1 = makeClient({ upsertData: null, upsertError: { message: 'insert fail' } });
    createRouteHandlerClientMock.mockResolvedValueOnce(s1.client);
    const r1 = await POST(new Request('https://example.com', { method: 'POST' }), {
      params: Promise.resolve({ id: '9' }),
    });
    expect(r1.status).toBe(500);

    const s2 = makeClient({ upsertData: [], upsertError: null });
    createRouteHandlerClientMock.mockResolvedValueOnce(s2.client);
    const r2 = await POST(new Request('https://example.com', { method: 'POST' }), {
      params: Promise.resolve({ id: '9' }),
    });
    expect(r2.status).toBe(409);
  });

  it('POST success logs activity, revalidates and returns like count', async () => {
    const s = makeClient({ upsertData: [{ id: 1 }], likeCount: 7 });
    createRouteHandlerClientMock.mockResolvedValue(s.client);

    const response = await POST(new Request('https://example.com', { method: 'POST' }), {
      params: Promise.resolve({ id: '9' }),
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { message: 'Article liked', liked: true, count: 7 },
    });
    expect(insertActivityMock).toHaveBeenCalled();
    expect(revalidateArticleLikeMock).toHaveBeenCalledWith('9');
  });

  it('POST success falls back count to 0 when count is null', async () => {
    const s = makeClient({ upsertData: [{ id: 1 }], likeCount: null });
    createRouteHandlerClientMock.mockResolvedValue(s.client);

    const response = await POST(new Request('https://example.com', { method: 'POST' }), {
      params: Promise.resolve({ id: '9' }),
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { message: 'Article liked', liked: true, count: 0 },
    });
  });

  it('POST handles unexpected errors as internal', async () => {
    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));
    const response = await POST(new Request('https://example.com', { method: 'POST' }), {
      params: Promise.resolve({ id: '9' }),
    });
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
  });

  it('DELETE maps unauthorized, 404 and delete-error paths', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeClient().client);
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError());
    const r1 = await DELETE(new Request('https://example.com', { method: 'DELETE' }), {
      params: Promise.resolve({ id: '9' }),
    });
    expect(r1.status).toBe(API_ERRORS.UNAUTHORIZED.status);

    const s2 = makeClient({ articleSingleData: null, articleSingleError: { message: 'nf' } });
    createRouteHandlerClientMock.mockResolvedValueOnce(s2.client);
    const r2 = await DELETE(new Request('https://example.com', { method: 'DELETE' }), {
      params: Promise.resolve({ id: '9' }),
    });
    expect(r2.status).toBe(404);

    const s3 = makeClient({ deleteError: { message: 'del fail' } });
    createRouteHandlerClientMock.mockResolvedValueOnce(s3.client);
    const r3 = await DELETE(new Request('https://example.com', { method: 'DELETE' }), {
      params: Promise.resolve({ id: '9' }),
    });
    expect(r3.status).toBe(500);
  });

  it('DELETE success logs activity, revalidates and returns count fallback', async () => {
    const s = makeClient({ likeCount: null });
    createRouteHandlerClientMock.mockResolvedValue(s.client);

    const response = await DELETE(new Request('https://example.com', { method: 'DELETE' }), {
      params: Promise.resolve({ id: '9' }),
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { message: 'Like removed', liked: false, count: 0 },
    });
    expect(insertActivityMock).toHaveBeenCalled();
    expect(revalidateArticleLikeMock).toHaveBeenCalledWith('9');
  });

  it('DELETE handles unexpected errors as internal', async () => {
    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));
    const response = await DELETE(new Request('https://example.com', { method: 'DELETE' }), {
      params: Promise.resolve({ id: '9' }),
    });
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
  });
});
