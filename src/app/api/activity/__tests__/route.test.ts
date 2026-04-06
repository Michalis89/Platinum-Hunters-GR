import 'whatwg-fetch';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

import { GET } from '@/app/api/activity/route';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { AUTH_ERROR } from '@/lib/constants/messages';

jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: jest.fn(),
}));

jest.mock('@/lib/api/auth', () => ({
  __esModule: true,
  requireAuth: jest.fn(),
  UnauthorizedError: class UnauthorizedError extends Error {},
}));

function createQueryResult(result: { data?: unknown; error?: unknown }) {
  type Query = {
    order: jest.Mock;
    limit: jest.Mock;
    eq: jest.Mock;
    then: (resolve: (value: unknown) => void) => void;
  };

  const query: Query = {
    order: jest.fn(),
    limit: jest.fn(),
    eq: jest.fn(),
    then: () => {},
  };
  query.order.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.then = (resolve: (value: unknown) => void) => resolve(result);
  return query;
}

describe('app/api/activity/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns global activity with default limit', async () => {
    const query = createQueryResult({ data: [{ id: 1 }], error: null });
    (createRouteHandlerClient as jest.Mock).mockResolvedValue({
      from: jest.fn(() => ({
        select: jest.fn(() => query),
      })),
    });

    const response = await GET(new Request('https://example.com/api/activity'));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ activities: [{ id: 1 }] });
    expect(query.limit).toHaveBeenCalledWith(20);
    expect(query.eq).not.toHaveBeenCalled();
  });

  it('clamps limit and filters by current user for scope=me', async () => {
    const query = createQueryResult({ data: [{ id: 2 }], error: null });
    const supabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => query),
      })),
    };
    (createRouteHandlerClient as jest.Mock).mockResolvedValue(supabase);
    (requireAuth as jest.Mock).mockResolvedValue({
      user: { id: 'user-1' },
    });

    const response = await GET(new Request('https://example.com/api/activity?scope=me&limit=999'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ activities: [{ id: 2 }] });
    expect(query.limit).toHaveBeenCalledWith(50);
    expect(requireAuth).toHaveBeenCalledWith(supabase);
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('uses the minimum clamped limit for invalid low values', async () => {
    const query = createQueryResult({ data: [], error: null });
    (createRouteHandlerClient as jest.Mock).mockResolvedValue({
      from: jest.fn(() => ({
        select: jest.fn(() => query),
      })),
    });

    const response = await GET(new Request('https://example.com/api/activity?limit=0'));

    expect(response.status).toBe(200);
    expect(query.limit).toHaveBeenCalledWith(1);
  });

  it('returns 500 when the activity query fails', async () => {
    const query = createQueryResult({ data: null, error: { message: 'db down' } });
    (createRouteHandlerClient as jest.Mock).mockResolvedValue({
      from: jest.fn(() => ({
        select: jest.fn(() => query),
      })),
    });

    const response = await GET(new Request('https://example.com/api/activity'));

    expect(console.error).toHaveBeenCalledWith('Failed to load activity:', { message: 'db down' });
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Activity loading error' });
  });

  it('returns an empty activities array when the query succeeds with null data', async () => {
    const query = createQueryResult({ data: null, error: null });
    (createRouteHandlerClient as jest.Mock).mockResolvedValue({
      from: jest.fn(() => ({
        select: jest.fn(() => query),
      })),
    });

    const response = await GET(new Request('https://example.com/api/activity'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ activities: [] });
  });

  it('returns 401 when scope=me is unauthorized', async () => {
    const query = createQueryResult({ data: [], error: null });
    const supabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => query),
      })),
    };
    (createRouteHandlerClient as jest.Mock).mockResolvedValue(supabase);
    (requireAuth as jest.Mock).mockRejectedValue(new UnauthorizedError('nope'));

    const response = await GET(new Request('https://example.com/api/activity?scope=me'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: AUTH_ERROR });
  });

  it('returns 500 on unexpected errors', async () => {
    (createRouteHandlerClient as jest.Mock).mockRejectedValue(new Error('boom'));

    const response = await GET(new Request('https://example.com/api/activity'));

    expect(console.error).toHaveBeenCalledWith('Activity API error:', expect.any(Error));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Activity loading error' });
  });
});
