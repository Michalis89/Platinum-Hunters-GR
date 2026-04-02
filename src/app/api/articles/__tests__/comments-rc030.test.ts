/**
 * @jest-environment node
 */

const mockCreateRouteHandlerClient = jest.fn();
const mockRequireAuth = jest.fn();
const mockGetUserBasicInfo = jest.fn();
const mockInsertActivity = jest.fn();
const mockRevalidateArticleComment = jest.fn();

const state = {
  commentsByKey: new Map<string, { id: number; content: string; user_id: string; article_id: number }>(),
  nextCommentId: 100,
};

const mockSupabase = {
  from: jest.fn((table: string) => {
    if (table === 'articles') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 1, title: 'A', slug: 'a' },
              error: null,
            }),
          }),
        }),
      };
    }

    if (table === 'article_comments') {
      return {
        upsert: jest.fn((payload: {
          article_id: number;
          user_id: string;
          content: string;
          idempotency_key?: string;
        }) => {
          return {
            select: jest.fn().mockImplementation(async () => {
              const key = payload.idempotency_key ?? '';
              if (!key) {
                const id = state.nextCommentId++;
                return {
                  data: [
                    {
                      id,
                      article_id: payload.article_id,
                      user_id: payload.user_id,
                      content: payload.content,
                      users: {
                        username: 'tester',
                        display_name: 'Tester',
                        avatar_url: null,
                      },
                    },
                  ],
                  error: null,
                };
              }

              const existing = state.commentsByKey.get(key);
              if (existing) {
                return { data: [], error: null };
              }
              const created = {
                id: state.nextCommentId++,
                article_id: payload.article_id,
                user_id: payload.user_id,
                content: payload.content,
              };
              state.commentsByKey.set(key, created);
              return {
                data: [
                  {
                    ...created,
                    users: {
                      username: 'tester',
                      display_name: 'Tester',
                      avatar_url: null,
                    },
                  },
                ],
                error: null,
              };
            }),
          };
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockImplementation(async () => {
                  for (const [key, value] of state.commentsByKey.entries()) {
                    if (!key) {
                      continue;
                    }
                    return {
                      data: {
                        ...value,
                        users: { username: 'tester', display_name: 'Tester', avatar_url: null },
                      },
                      error: null,
                    };
                  }
                  return { data: null, error: null };
                }),
              }),
            }),
          }),
        }),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  }),
};

jest.mock('@/lib/supabase-route-handler', () => ({
  createRouteHandlerClient: (...args: unknown[]) => mockCreateRouteHandlerClient(...args),
}));

jest.mock('@/lib/api/auth', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  UnauthorizedError: class UnauthorizedError extends Error {},
}));

jest.mock('@/lib/services/userService', () => ({
  getUserBasicInfo: (...args: unknown[]) => mockGetUserBasicInfo(...args),
  getUserFullInfo: jest.fn(),
}));

jest.mock('@/lib/services/activityService', () => ({
  insertActivity: (...args: unknown[]) => mockInsertActivity(...args),
}));

jest.mock('@/lib/cache/tags', () => ({
  revalidateCache: {
    articleComment: (...args: unknown[]) => mockRevalidateArticleComment(...args),
  },
}));

jest.mock('@/lib/observability/withApiRoute', () => ({
  withApiRoute: (handler: (...args: unknown[]) => unknown) => handler,
}));

describe('RC-030 comments idempotency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    state.commentsByKey.clear();
    state.nextCommentId = 100;
    mockCreateRouteHandlerClient.mockResolvedValue(mockSupabase);
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockGetUserBasicInfo.mockResolvedValue({
      username: 'tester',
      display_name: 'Tester',
      avatar_url: null,
    });
    mockInsertActivity.mockResolvedValue(undefined);
  });

  it('returns success for duplicate POST with same idempotency key and logs activity once', async () => {
    const { POST } = await import('@/app/api/articles/[id]/comments/route');

    const reqA = new Request('http://localhost/api/articles/1/comments', {
      method: 'POST',
      body: JSON.stringify({ content: 'Same', idempotency_key: 'same-key-1' }),
    });
    const reqB = new Request('http://localhost/api/articles/1/comments', {
      method: 'POST',
      body: JSON.stringify({ content: 'Same', idempotency_key: 'same-key-1' }),
    });

    const ctx = { params: Promise.resolve({ id: '1' }) };
    const resA = await POST(reqA, ctx);
    const resB = await POST(reqB, ctx);
    const bodyA = await resA.json();
    const bodyB = await resB.json();

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);
    expect(bodyA.comment?.id).toBeDefined();
    expect(bodyB.comment?.id).toBeDefined();
    expect(mockInsertActivity).toHaveBeenCalledTimes(1);
    expect(mockRevalidateArticleComment).toHaveBeenCalledTimes(1);
  });
});
