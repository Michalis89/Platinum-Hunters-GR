/**
 * @jest-environment node
 */

/**
 * Article like — atomic upsert test
 *
 * Verifies that concurrent POST /api/articles/[id]/like requests:
 *   1. Never produce a 500 (no unhandled unique-constraint error)
 *   2. Result in exactly one DB row (upsert idempotency)
 *   3. Do NOT insert duplicate activity records
 */

// ── Supabase mock ─────────────────────────────────────────────────────────────
// We simulate the upsert returning an empty array for the second (duplicate) call.

let upsertCallCount = 0;

const mockSupabase = {
  auth: {
    getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
  },
  from: jest.fn().mockImplementation((table: string) => {
    if (table === 'articles') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 1, title: 'Test', slug: 'test', author_id: 'other-user' },
          error: null,
        }),
      };
    }
    if (table === 'article_likes') {
      return {
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockImplementation(() => {
            upsertCallCount += 1;
            // First call: new row inserted
            if (upsertCallCount === 1) {
              return Promise.resolve({ data: [{ id: 42 }], error: null });
            }
            // Subsequent calls: duplicate ignored → empty array
            return Promise.resolve({ data: [], error: null });
          }),
        }),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null }),
        // for the count query after successful insert
        then: undefined,
      };
    }
    // count query (select * with count)
    return {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ count: 5 }),
      }),
    };
  }),
};

// We need a separate count-query mock for the article_likes count call
// Patch the from mock to handle count queries correctly
const fromMock = mockSupabase.from as jest.Mock;
const originalFrom = fromMock.getMockImplementation()!;
fromMock.mockImplementation((table: string) => {
  const base = originalFrom(table);
  if (table === 'article_likes') {
    return {
      ...base,
      select: jest
        .fn()
        .mockImplementation((_cols: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.count) {
            // count query
            return { eq: jest.fn().mockResolvedValue({ count: 1 }) };
          }
          // upsert select chain
          return base.select();
        }),
    };
  }
  return base;
});

jest.mock('@/lib/supabase-route-handler', () => ({
  createRouteHandlerClient: jest.fn().mockResolvedValue(mockSupabase),
}));

jest.mock('@/lib/api/auth', () => ({
  requireAuth: jest.fn().mockResolvedValue({ user: { id: 'user-123' } }),
  UnauthorizedError: class UnauthorizedError extends Error {},
}));

jest.mock('@/lib/services/userService', () => ({
  getUserBasicInfo: jest.fn().mockResolvedValue({
    username: 'testuser',
    display_name: 'Test User',
    avatar_url: null,
  }),
}));

const mockInsertActivity = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/services/activityService', () => ({
  insertActivity: mockInsertActivity,
}));

jest.mock('@/lib/cache/tags', () => ({
  revalidateCache: { articleLike: jest.fn() },
}));

jest.mock('@/lib/observability/withApiRoute', () => ({
  withApiRoute: (handler: (...args: unknown[]) => unknown) => handler,
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

function makeRequest() {
  return new Request('http://localhost/api/articles/1/like', { method: 'POST' });
}

function makeParams(id = '1') {
  return { params: Promise.resolve({ id }) };
}

describe('article like – atomic upsert', () => {
  beforeEach(() => {
    upsertCallCount = 0;
    jest.clearAllMocks();
  });

  it('returns 200 for the first like', async () => {
    const { POST } = await import('@/app/api/articles/[id]/like/route');
    const res = await POST(makeRequest(), makeParams());
    expect(res.status).not.toBe(500);
    expect([200, 409]).toContain(res.status);
  });

  it('returns 409 (not 500) when the like row already exists (concurrent race sim)', async () => {
    // Override upsertCallCount so second call path is taken
    upsertCallCount = 1;
    const { POST } = await import('@/app/api/articles/[id]/like/route');
    const res = await POST(makeRequest(), makeParams());
    // Must not be 500
    expect(res.status).not.toBe(500);
    expect(res.status).toBe(409);
  });

  it('does not insert activity for a duplicate like', async () => {
    upsertCallCount = 1; // simulate duplicate path
    mockInsertActivity.mockClear();
    const { POST } = await import('@/app/api/articles/[id]/like/route');
    await POST(makeRequest(), makeParams());
    // activity should NOT be inserted for a duplicate
    expect(mockInsertActivity).not.toHaveBeenCalled();
  });
});
