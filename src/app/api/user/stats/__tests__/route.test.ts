import 'whatwg-fetch';

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

const createRouteHandlerClientMock = jest.fn();
const requireAuthMock = jest.fn();

jest.mock('@/lib/supabase-route-handler', () => ({
  createRouteHandlerClient: () => createRouteHandlerClientMock(),
}));

jest.mock('@/lib/api/auth', () => ({
  UnauthorizedError: class UnauthorizedError extends Error {
    code = 'UNAUTHORIZED';
  },
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
}));

import { API_ERRORS } from '@/lib/api/errors';
import { UnauthorizedError } from '@/lib/api/auth';
import { GET, revalidate } from '@/app/api/user/stats/route';

function makeSupabaseMock(config?: { rpcData?: unknown; rpcError?: unknown }) {
  const rpc = jest.fn().mockResolvedValue({
    data: config?.rpcData ?? null,
    error: config?.rpcError ?? null,
  });
  return { client: { rpc }, spies: { rpc } };
}

describe('app/api/user/stats/route', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('exports revalidate', () => {
    expect(revalidate).toBe(300);
  });

  it('returns calculated personal stats from RPC', async () => {
    const supabase = makeSupabaseMock({
      rpcData: {
        total_backlog: 2,
        in_progress: 1,
        completed: 1,
        total_hours: 5,
        games: { total: 1, in_progress: 1, completed: 0, dropped: 0, hours: 2 },
        anime: { total: 1, in_progress: 0, completed: 1, dropped: 0, hours: 3 },
        manga: { total: 0, in_progress: 0, completed: 0, dropped: 0, hours: 0, chapters: 0 },
        movies: { total: 0, in_progress: 0, completed: 0, dropped: 0, hours: 0 },
        tv: { total: 0, in_progress: 0, completed: 0, dropped: 0, hours: 0 },
        books: { total: 0, in_progress: 0, completed: 0, dropped: 0, hours: 0, pages: 0 },
        active_categories: ['games', 'anime'],
      },
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase.client);

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.total_backlog).toBe(2);
    expect(supabase.spies.rpc).toHaveBeenCalledWith('calculate_user_stats', {
      p_user_id: 'user-1',
    });
  });

  it('returns EMPTY_STATS when RPC returns null data', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabaseMock({ rpcData: null }).client);

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      total_backlog: 0,
      in_progress: 0,
      completed: 0,
      total_hours: 0,
      active_categories: [],
    });
  });

  it('returns unauthorized when requireAuth throws UnauthorizedError', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabaseMock().client);
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError());

    const response = await GET();
    expect(response.status).toBe(API_ERRORS.UNAUTHORIZED.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.UNAUTHORIZED);
  });

  it('returns unauthorized when thrown error has unauthorized API code', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabaseMock({ rpcError: { code: API_ERRORS.UNAUTHORIZED.code } }).client,
    );

    const response = await GET();
    expect(response.status).toBe(API_ERRORS.UNAUTHORIZED.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.UNAUTHORIZED);
  });

  it('returns internal for unexpected errors', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabaseMock({ rpcError: { code: 'XX000', message: 'db fail' } }).client,
    );

    const response = await GET();
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });
});
