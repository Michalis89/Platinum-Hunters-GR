import 'whatwg-fetch';

jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

const createRouteHandlerClientMock = jest.fn();

jest.mock('@/lib/supabase-route-handler', () => ({
  createRouteHandlerClient: () => createRouteHandlerClientMock(),
}));

import { POST } from '@/app/api/track-view/route';

function makeSupabaseMock(config?: {
  sessionUserId?: string | null;
  articleAuthorId?: string | null;
  insertError?: unknown;
}) {
  const getSession = jest.fn().mockResolvedValue({
    data: {
      session: config?.sessionUserId ? { user: { id: config.sessionUserId } } : null,
    },
  });

  const maybeSingle = jest.fn().mockResolvedValue({
    data: { author_id: config?.articleAuthorId ?? null },
    error: null,
  });
  const articleEq = jest.fn().mockReturnValue({ maybeSingle });
  const articleSelect = jest.fn().mockReturnValue({ eq: articleEq });

  const insert = jest.fn().mockResolvedValue({ error: config?.insertError ?? null });

  const from = jest.fn().mockImplementation((table: string) => {
    if (table === 'articles') {
      return { select: articleSelect };
    }
    if (table === 'article_views') {
      return { insert };
    }
    return {};
  });

  return {
    client: {
      auth: { getSession },
      from,
    },
    spies: { getSession, maybeSingle, insert, from },
  };
}

describe('app/api/track-view/route', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('returns 400 for invalid articleId values', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabaseMock().client);

    const r1 = await POST(new Request('https://example.com', { method: 'POST', body: '{}' }));
    expect(r1.status).toBe(400);
    await expect(r1.json()).resolves.toEqual({ error: 'Invalid articleId' });

    const r2 = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ articleId: 0 }),
      }),
    );
    expect(r2.status).toBe(400);

    const r3 = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ articleId: 1.5 }),
      }),
    );
    expect(r3.status).toBe(400);
  });

  it('returns 204 when user is not authenticated', async () => {
    const supabase = makeSupabaseMock({ sessionUserId: null });
    createRouteHandlerClientMock.mockResolvedValue(supabase.client);

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ articleId: 10 }),
      }),
    );
    expect(response.status).toBe(204);
    expect(supabase.spies.from).not.toHaveBeenCalled();
  });

  it('returns 204 when viewer is article author', async () => {
    const supabase = makeSupabaseMock({ sessionUserId: 'u1', articleAuthorId: 'u1' });
    createRouteHandlerClientMock.mockResolvedValue(supabase.client);

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ articleId: 5 }),
      }),
    );
    expect(response.status).toBe(204);
    expect(supabase.spies.insert).not.toHaveBeenCalled();
  });

  it('inserts article view and returns 204 on success', async () => {
    const supabase = makeSupabaseMock({ sessionUserId: 'u1', articleAuthorId: 'u2' });
    createRouteHandlerClientMock.mockResolvedValue(supabase.client);

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ articleId: 5 }),
      }),
    );
    expect(response.status).toBe(204);
    expect(supabase.spies.insert).toHaveBeenCalledWith({ article_id: 5, user_id: 'u1' });
  });

  it('returns 500 when insert fails', async () => {
    const supabase = makeSupabaseMock({
      sessionUserId: 'u1',
      articleAuthorId: 'u2',
      insertError: { message: 'insert fail' },
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase.client);

    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ articleId: 5 }),
      }),
    );
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to track view' });
  });

  it('returns 400 for invalid JSON body', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabaseMock().client);
    const response = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: '{"bad"',
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid request body' });
  });
});
