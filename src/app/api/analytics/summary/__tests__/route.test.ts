jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

import { GET } from '@/app/api/analytics/summary/route';
import { createClient } from '@supabase/supabase-js';

type SelectResult = {
  count?: number | null;
  error?: unknown;
};

function createSupabaseMock({
  usersResult,
  activeUsersResult,
  mediaResult,
}: {
  usersResult: SelectResult;
  activeUsersResult: SelectResult;
  mediaResult: SelectResult;
}) {
  let usedUsersSelect = false;
  const activeQuery = {
    gte: jest.fn().mockResolvedValue(activeUsersResult),
  };

  return {
    from: jest.fn((table: string) => ({
      select: jest.fn(() => {
        if (table === 'users') {
          if (!usedUsersSelect) {
            usedUsersSelect = true;
            return Promise.resolve(usersResult);
          }
          return activeQuery;
        }
        return Promise.resolve(mediaResult);
      }),
    })),
    __activeQuery: activeQuery,
  };
}

describe('app/api/analytics/summary/route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.test',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role',
    };
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('returns 500 when required Supabase env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Missing Supabase env vars' });
    expect(createClient).not.toHaveBeenCalled();
  });

  it('returns analytics counts on success', async () => {
    const supabase = createSupabaseMock({
      usersResult: { count: 10, error: null },
      activeUsersResult: { count: 3, error: null },
      mediaResult: { count: 42, error: null },
    });
    (createClient as jest.Mock).mockReturnValue(supabase);

    const response = await GET();

    expect(createClient).toHaveBeenCalledWith('https://supabase.test', 'service-role');
    expect(supabase.from).toHaveBeenNthCalledWith(1, 'users');
    expect(supabase.from).toHaveBeenNthCalledWith(2, 'users');
    expect(supabase.from).toHaveBeenNthCalledWith(3, 'media_items');
    expect(supabase.__activeQuery.gte).toHaveBeenCalledWith(
      'last_login',
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      total_users: 10,
      active_users_now: 3,
      total_media_items: 42,
    });
  });

  it('falls back to zero counts when Supabase returns null counts', async () => {
    const supabase = createSupabaseMock({
      usersResult: { count: null, error: null },
      activeUsersResult: { count: null, error: null },
      mediaResult: { count: null, error: null },
    });
    (createClient as jest.Mock).mockReturnValue(supabase);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      total_users: 0,
      active_users_now: 0,
      total_media_items: 0,
    });
  });

  it('returns 500 when any analytics query reports an error', async () => {
    const supabase = createSupabaseMock({
      usersResult: { count: 10, error: null },
      activeUsersResult: { count: 3, error: { message: 'active failed' } },
      mediaResult: { count: 42, error: null },
    });
    (createClient as jest.Mock).mockReturnValue(supabase);

    const response = await GET();

    expect(console.error).toHaveBeenCalledWith('Analytics fetch error:', {
      message: 'active failed',
    });
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Analytics loading error' });
  });

  it('returns 500 when the server throws unexpectedly', async () => {
    (createClient as jest.Mock).mockReturnValue({
      from: jest.fn(() => {
        throw new Error('boom');
      }),
    });

    const response = await GET();

    expect(console.error).toHaveBeenCalledWith('Analytics server error:', expect.any(Error));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Analytics loading error' });
  });
});
