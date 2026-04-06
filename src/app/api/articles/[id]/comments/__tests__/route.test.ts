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
const createSupabaseAdminClientMock = jest.fn();
const insertActivityMock = jest.fn();
const getUserBasicInfoMock = jest.fn();
const getUserFullInfoMock = jest.fn();
const requireAuthMock = jest.fn();
const hasAnyRoleMock = jest.fn();
const revalidateArticleCommentMock = jest.fn();

jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

jest.mock('@/lib/supabase-route-handler', () => ({
  createRouteHandlerClient: (...args: unknown[]) => createRouteHandlerClientMock(...args),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => createSupabaseAdminClientMock(),
}));

jest.mock('@/lib/services/activityService', () => ({
  insertActivity: (...args: unknown[]) => insertActivityMock(...args),
}));

jest.mock('@/lib/services/userService', () => ({
  getUserBasicInfo: (...args: unknown[]) => getUserBasicInfoMock(...args),
  getUserFullInfo: (...args: unknown[]) => getUserFullInfoMock(...args),
}));

jest.mock('@/lib/api/auth', () => ({
  UnauthorizedError: class UnauthorizedError extends Error {
    code = 'UNAUTHORIZED';
  },
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
}));

jest.mock('@/lib/roles', () => ({
  hasAnyRole: (...args: unknown[]) => hasAnyRoleMock(...args),
}));

jest.mock('@/lib/cache/tags', () => ({
  revalidateCache: {
    articleComment: (...args: unknown[]) => revalidateArticleCommentMock(...args),
  },
}));

import { API_ERRORS } from '@/lib/api/errors';
import { UnauthorizedError } from '@/lib/api/auth';
import { GET, POST, DELETE, PATCH } from '@/app/api/articles/[id]/comments/route';

type Result = { data: unknown; error: unknown; count?: number | null };

function makeClient(config?: {
  commentsRangeResult?: Result;
  commentsSingleResult?: Result;
  commentsMaybeSingleResult?: Result;
  articleSingleResult?: Result;
  upsertSelectResult?: Result;
  deleteMaybeSingleResult?: Result;
  updateSingleResult?: Result;
}) {
  const commentsChain: {
    eq: jest.Mock;
    order: jest.Mock;
    range: jest.Mock;
    single: jest.Mock;
    maybeSingle: jest.Mock;
  } = {
    eq: jest.fn(),
    order: jest.fn(),
    range: jest
      .fn()
      .mockResolvedValue(config?.commentsRangeResult ?? { data: [], error: null, count: 0 }),
    single: jest
      .fn()
      .mockResolvedValue(config?.commentsSingleResult ?? { data: null, error: null }),
    maybeSingle: jest
      .fn()
      .mockResolvedValue(config?.commentsMaybeSingleResult ?? { data: null, error: null }),
  };
  commentsChain.eq.mockReturnValue(commentsChain);
  commentsChain.order.mockReturnValue(commentsChain);

  const commentsSelect = jest.fn().mockReturnValue(commentsChain);
  const commentsUpsertSelect = jest
    .fn()
    .mockResolvedValue(config?.upsertSelectResult ?? { data: [], error: null });
  const commentsUpsert = jest.fn().mockReturnValue({ select: commentsUpsertSelect });

  const deleteMaybeSingle = jest
    .fn()
    .mockResolvedValue(config?.deleteMaybeSingleResult ?? { data: { id: 1 }, error: null });
  const deleteSelect = jest.fn().mockReturnValue({ maybeSingle: deleteMaybeSingle });
  const deleteEq2 = jest.fn().mockReturnValue({ select: deleteSelect });
  const deleteEq1 = jest.fn().mockReturnValue({ eq: deleteEq2 });
  const commentsDelete = jest.fn().mockReturnValue({ eq: deleteEq1 });

  const updateSingle = jest
    .fn()
    .mockResolvedValue(config?.updateSingleResult ?? { data: { id: 1 }, error: null });
  const updateSelect = jest.fn().mockReturnValue({ single: updateSingle });
  const updateEq = jest.fn().mockReturnValue({ select: updateSelect });
  const commentsUpdate = jest.fn().mockReturnValue({ eq: updateEq });

  const articleSingle = jest
    .fn()
    .mockResolvedValue(
      config?.articleSingleResult ?? { data: { id: 1, title: 'T', slug: 's' }, error: null },
    );
  const articleEq = jest.fn().mockReturnValue({ single: articleSingle });
  const articleSelect = jest.fn().mockReturnValue({ eq: articleEq });

  const from = jest.fn().mockImplementation((table: string) => {
    if (table === 'article_comments') {
      return {
        select: commentsSelect,
        upsert: commentsUpsert,
        delete: commentsDelete,
        update: commentsUpdate,
      };
    }
    if (table === 'articles') {
      return { select: articleSelect };
    }
    return {};
  });

  return {
    client: { from },
    spies: {
      commentsSelect,
      commentsChain,
      commentsUpsert,
      commentsUpsertSelect,
      commentsDelete,
      deleteEq1,
      deleteEq2,
      deleteMaybeSingle,
      commentsUpdate,
      updateEq,
      updateSingle,
    },
  };
}

describe('app/api/articles/[id]/comments/route', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    getUserBasicInfoMock.mockResolvedValue({
      username: 'u',
      display_name: 'U',
      avatar_url: '/u.png',
    });
    getUserFullInfoMock.mockResolvedValue({
      roles: ['user'],
      username: 'u',
      display_name: 'U',
      avatar_url: '/u.png',
    });
    hasAnyRoleMock.mockImplementation(
      (user: { roles?: unknown }, roles: string[]) =>
        Array.isArray(user?.roles) && user.roles.some(role => roles.includes(String(role))),
    );
    insertActivityMock.mockResolvedValue(undefined);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('GET returns comments with metadata and clamps pagination', async () => {
    const s = makeClient({ commentsRangeResult: { data: [{ id: 1 }], error: null, count: 5 } });
    createRouteHandlerClientMock.mockResolvedValue(s.client);

    const response = await GET(
      new Request('https://example.com/api/articles/1/comments?limit=999&offset=-3'),
      { params: Promise.resolve({ id: '1' }) },
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([{ id: 1 }]);
    expect(body.meta).toEqual({ total: 5, limit: 100, offset: 0 });
  });

  it('GET returns 500 on query error and catches thrown errors', async () => {
    const s1 = makeClient({
      commentsRangeResult: { data: null, error: { message: 'fail' }, count: null },
    });
    createRouteHandlerClientMock.mockResolvedValueOnce(s1.client);
    const r1 = await GET(new Request('https://example.com/api/articles/1/comments'), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(r1.status).toBe(500);

    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));
    const r2 = await GET(new Request('https://example.com/api/articles/1/comments'), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(r2.status).toBe(API_ERRORS.INTERNAL.status);
  });

  it('POST validates auth/content length/article existence', async () => {
    const s = makeClient();
    createRouteHandlerClientMock.mockResolvedValue(s.client);
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError());
    const r1 = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ content: 'x' }),
      }),
      { params: Promise.resolve({ id: '1' }) },
    );
    expect(r1.status).toBe(API_ERRORS.UNAUTHORIZED.status);

    createRouteHandlerClientMock.mockResolvedValueOnce(s.client);
    const r2 = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ content: '   ' }),
      }),
      { params: Promise.resolve({ id: '1' }) },
    );
    expect(r2.status).toBe(400);

    createRouteHandlerClientMock.mockResolvedValueOnce(s.client);
    const r3 = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ content: 'x'.repeat(2001) }),
      }),
      { params: Promise.resolve({ id: '1' }) },
    );
    expect(r3.status).toBe(400);

    const s4 = makeClient({ articleSingleResult: { data: null, error: { message: 'nf' } } });
    createRouteHandlerClientMock.mockResolvedValueOnce(s4.client);
    const r4 = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ content: 'ok' }),
      }),
      { params: Promise.resolve({ id: '1' }) },
    );
    expect(r4.status).toBe(404);
  });

  it('POST handles insert error and idempotency replay/no-replay branches', async () => {
    const s1 = makeClient({ upsertSelectResult: { data: null, error: { message: 'ins fail' } } });
    createRouteHandlerClientMock.mockResolvedValueOnce(s1.client);
    const r1 = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ content: 'ok', idempotency_key: 'k1' }),
      }),
      { params: Promise.resolve({ id: '1' }) },
    );
    expect(r1.status).toBe(500);

    const s2 = makeClient({
      upsertSelectResult: { data: [], error: null },
      commentsMaybeSingleResult: { data: { id: 77 }, error: null },
    });
    createRouteHandlerClientMock.mockResolvedValueOnce(s2.client);
    const r2 = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ content: 'ok', idempotency_key: 'k2' }),
      }),
      { params: Promise.resolve({ id: '1' }) },
    );
    expect(r2.status).toBe(200);
    await expect(r2.json()).resolves.toEqual({
      data: { message: 'Comment already processed', comment: { id: 77 } },
    });

    const s3 = makeClient({
      upsertSelectResult: { data: [], error: null },
      commentsMaybeSingleResult: { data: null, error: null },
    });
    createRouteHandlerClientMock.mockResolvedValueOnce(s3.client);
    const r3 = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ content: 'ok', idempotency_key: 'k3' }),
      }),
      { params: Promise.resolve({ id: '1' }) },
    );
    expect(r3.status).toBe(500);
  });

  it('POST success inserts, logs activity, and revalidates cache', async () => {
    const s = makeClient({
      upsertSelectResult: { data: [{ id: 11, content: 'ok' }], error: null },
      articleSingleResult: { data: { id: 1, title: 'A', slug: 'a' }, error: null },
    });
    createRouteHandlerClientMock.mockResolvedValue(s.client);

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ content: '  hello  ' }),
      }),
      { params: Promise.resolve({ id: '1' }) },
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.message).toBe('Comment added successfully');
    expect(s.spies.commentsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'hello', article_id: 1, user_id: 'user-1' }),
      expect.objectContaining({
        onConflict: 'article_id,user_id,idempotency_key',
        ignoreDuplicates: true,
      }),
    );
    expect(insertActivityMock).toHaveBeenCalled();
    expect(revalidateArticleCommentMock).toHaveBeenCalledWith(1);
  });

  it('POST catches unexpected errors as internal', async () => {
    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom-post'));
    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ content: 'ok' }),
      }),
      { params: Promise.resolve({ id: '1' }) },
    );
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
  });

  it('DELETE validates inputs, permissions, and delete outcomes', async () => {
    const s1 = makeClient();
    createRouteHandlerClientMock.mockResolvedValueOnce(s1.client);
    const r1 = await DELETE(new Request('https://example.com/api/articles/1/comments'), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(r1.status).toBe(400);

    createRouteHandlerClientMock.mockResolvedValueOnce(s1.client);
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError());
    const r2 = await DELETE(
      new Request('https://example.com/api/articles/1/comments?commentId=1'),
      {
        params: Promise.resolve({ id: '1' }),
      },
    );
    expect(r2.status).toBe(API_ERRORS.UNAUTHORIZED.status);

    const s3 = makeClient({ commentsSingleResult: { data: null, error: { message: 'nf' } } });
    createRouteHandlerClientMock.mockResolvedValueOnce(s3.client);
    const r3 = await DELETE(
      new Request('https://example.com/api/articles/1/comments?commentId=1'),
      {
        params: Promise.resolve({ id: '1' }),
      },
    );
    expect(r3.status).toBe(404);

    const s4 = makeClient({
      commentsSingleResult: { data: { id: 1, article_id: 1, user_id: 'other' }, error: null },
    });
    createRouteHandlerClientMock.mockResolvedValueOnce(s4.client);
    getUserFullInfoMock.mockResolvedValueOnce({ roles: ['user'] });
    const r4 = await DELETE(
      new Request('https://example.com/api/articles/1/comments?commentId=1'),
      {
        params: Promise.resolve({ id: '1' }),
      },
    );
    expect(r4.status).toBe(403);

    const s5 = makeClient({
      commentsSingleResult: { data: { id: 1, article_id: 1, user_id: 'user-1' }, error: null },
      deleteMaybeSingleResult: { data: null, error: { message: 'del fail' } },
    });
    createRouteHandlerClientMock.mockResolvedValueOnce(s5.client);
    const r5 = await DELETE(
      new Request('https://example.com/api/articles/1/comments?commentId=1'),
      {
        params: Promise.resolve({ id: '1' }),
      },
    );
    expect(r5.status).toBe(500);

    const s6 = makeClient({
      commentsSingleResult: { data: { id: 1, article_id: 1, user_id: 'user-1' }, error: null },
      deleteMaybeSingleResult: { data: null, error: null },
    });
    createRouteHandlerClientMock.mockResolvedValueOnce(s6.client);
    const r6 = await DELETE(
      new Request('https://example.com/api/articles/1/comments?commentId=1'),
      {
        params: Promise.resolve({ id: '1' }),
      },
    );
    expect(r6.status).toBe(409);
  });

  it('DELETE uses admin client for admin deleting others comment and succeeds', async () => {
    const routeClient = makeClient({
      commentsSingleResult: { data: { id: 1, article_id: 1, user_id: 'other' }, error: null },
    });
    const adminClient = makeClient({
      deleteMaybeSingleResult: { data: { id: 1 }, error: null },
    });
    createRouteHandlerClientMock.mockResolvedValue(routeClient.client);
    createSupabaseAdminClientMock.mockReturnValue(adminClient.client);
    getUserFullInfoMock.mockResolvedValueOnce({ roles: ['admin'] });

    const response = await DELETE(
      new Request('https://example.com/api/articles/1/comments?commentId=1'),
      {
        params: Promise.resolve({ id: '1' }),
      },
    );
    expect(response.status).toBe(200);
    expect(createSupabaseAdminClientMock).toHaveBeenCalled();
    expect(revalidateArticleCommentMock).toHaveBeenCalledWith(1);
  });

  it('PATCH validates input/auth/permission and update outcomes', async () => {
    const s1 = makeClient();
    createRouteHandlerClientMock.mockResolvedValueOnce(s1.client);
    const r1 = await PATCH(
      new Request('https://example.com', { method: 'PATCH', body: JSON.stringify({}) }),
      { params: Promise.resolve({ id: '1' }) },
    );
    expect(r1.status).toBe(400);

    createRouteHandlerClientMock.mockResolvedValueOnce(s1.client);
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError());
    const r2 = await PATCH(
      new Request('https://example.com', {
        method: 'PATCH',
        body: JSON.stringify({ commentId: 1, content: 'ok' }),
      }),
      { params: Promise.resolve({ id: '1' }) },
    );
    expect(r2.status).toBe(API_ERRORS.UNAUTHORIZED.status);

    createRouteHandlerClientMock.mockResolvedValueOnce(s1.client);
    const r3 = await PATCH(
      new Request('https://example.com', {
        method: 'PATCH',
        body: JSON.stringify({ commentId: 1, content: 'x'.repeat(2001) }),
      }),
      { params: Promise.resolve({ id: '1' }) },
    );
    expect(r3.status).toBe(400);

    const s4 = makeClient({ commentsSingleResult: { data: null, error: { message: 'nf' } } });
    createRouteHandlerClientMock.mockResolvedValueOnce(s4.client);
    const r4 = await PATCH(
      new Request('https://example.com', {
        method: 'PATCH',
        body: JSON.stringify({ commentId: 1, content: 'ok' }),
      }),
      { params: Promise.resolve({ id: '1' }) },
    );
    expect(r4.status).toBe(404);

    const s5 = makeClient({
      commentsSingleResult: { data: { id: 1, article_id: 1, user_id: 'other' }, error: null },
    });
    createRouteHandlerClientMock.mockResolvedValueOnce(s5.client);
    getUserFullInfoMock.mockResolvedValueOnce({ roles: ['user'] });
    const r5 = await PATCH(
      new Request('https://example.com', {
        method: 'PATCH',
        body: JSON.stringify({ commentId: 1, content: 'ok' }),
      }),
      { params: Promise.resolve({ id: '1' }) },
    );
    expect(r5.status).toBe(403);

    const s6 = makeClient({
      commentsSingleResult: { data: { id: 1, article_id: 1, user_id: 'user-1' }, error: null },
      updateSingleResult: { data: null, error: { message: 'upd fail' } },
    });
    createRouteHandlerClientMock.mockResolvedValueOnce(s6.client);
    const r6 = await PATCH(
      new Request('https://example.com', {
        method: 'PATCH',
        body: JSON.stringify({ commentId: 1, content: 'ok' }),
      }),
      { params: Promise.resolve({ id: '1' }) },
    );
    expect(r6.status).toBe(500);
  });

  it('PATCH uses admin client for admin editing others comment and succeeds', async () => {
    const routeClient = makeClient({
      commentsSingleResult: { data: { id: 1, article_id: 1, user_id: 'other' }, error: null },
    });
    const adminClient = makeClient({
      updateSingleResult: { data: { id: 1, content: 'new' }, error: null },
    });
    createRouteHandlerClientMock.mockResolvedValue(routeClient.client);
    createSupabaseAdminClientMock.mockReturnValue(adminClient.client);
    getUserFullInfoMock.mockResolvedValueOnce({ roles: ['owner'] });

    const response = await PATCH(
      new Request('https://example.com', {
        method: 'PATCH',
        body: JSON.stringify({ commentId: 1, content: '  updated  ' }),
      }),
      { params: Promise.resolve({ id: '1' }) },
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.message).toBe('Comment updated successfully');
    expect(createSupabaseAdminClientMock).toHaveBeenCalled();
    expect(revalidateArticleCommentMock).toHaveBeenCalledWith(1);
  });

  it('DELETE/PATCH catch unexpected errors as internal', async () => {
    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom-del'));
    const r1 = await DELETE(
      new Request('https://example.com/api/articles/1/comments?commentId=1'),
      {
        params: Promise.resolve({ id: '1' }),
      },
    );
    expect(r1.status).toBe(API_ERRORS.INTERNAL.status);

    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom-patch'));
    const r2 = await PATCH(
      new Request('https://example.com', {
        method: 'PATCH',
        body: JSON.stringify({ commentId: 1, content: 'ok' }),
      }),
      { params: Promise.resolve({ id: '1' }) },
    );
    expect(r2.status).toBe(API_ERRORS.INTERNAL.status);
  });
});
