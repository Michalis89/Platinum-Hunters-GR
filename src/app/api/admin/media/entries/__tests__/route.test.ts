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
const requireAdminRoleMock = jest.fn();

jest.mock('@/lib/supabase-route-handler', () => ({
  createRouteHandlerClient: () => createRouteHandlerClientMock(),
}));

jest.mock('@/lib/api/permissions', () => ({
  ForbiddenError: class ForbiddenError extends Error {
    code = 'FORBIDDEN';
  },
  requireAdminRole: (...args: unknown[]) => requireAdminRoleMock(...args),
}));

jest.mock('@/lib/api/auth', () => ({
  UnauthorizedError: class UnauthorizedError extends Error {
    code = 'UNAUTHORIZED';
  },
}));

import { API_ERRORS } from '@/lib/api/errors';
import { UnauthorizedError } from '@/lib/api/auth';
import { ForbiddenError } from '@/lib/api/permissions';
import { GET, dynamic } from '@/app/api/admin/media/entries/route';

type MainResult = { data: unknown; error: unknown; count: number | null };
type DistinctResult = { data: unknown; error: unknown };

function makeSupabaseMock(config?: {
  mainResult?: MainResult;
  distinctResults?: Record<string, DistinctResult>;
}) {
  const mainResult: MainResult = config?.mainResult ?? { data: [], error: null, count: 0 };
  const distinctResults = config?.distinctResults ?? {};

  const mainQuery = {
    order: jest.fn(),
    range: jest.fn(),
    eq: jest.fn(),
    ilike: jest.fn(),
    or: jest.fn(),
    gte: jest.fn(),
    then: (resolve: (value: MainResult) => unknown) => Promise.resolve(resolve(mainResult)),
  };
  mainQuery.order.mockReturnValue(mainQuery);
  mainQuery.range.mockReturnValue(mainQuery);
  mainQuery.eq.mockReturnValue(mainQuery);
  mainQuery.ilike.mockReturnValue(mainQuery);
  mainQuery.or.mockReturnValue(mainQuery);
  mainQuery.gte.mockReturnValue(mainQuery);

  const distinctQueries: Array<{ column: string; limit: jest.Mock }> = [];

  const from = jest.fn().mockImplementation(() => ({
    select: jest.fn().mockImplementation((column: string, options?: { count?: string }) => {
      if (options?.count === 'exact') {
        return mainQuery;
      }

      const result = distinctResults[column] ?? { data: [], error: null };
      const limit = jest.fn().mockResolvedValue(result);
      distinctQueries.push({ column, limit });
      return {
        not: jest.fn().mockReturnValue({ limit }),
      };
    }),
  }));

  const supabase = { from };

  return { supabase, from, mainQuery, distinctQueries };
}

describe('app/api/admin/media/entries/route', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('exports force-dynamic mode', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('returns list with filter metadata and applies all query filters', async () => {
    const env = makeSupabaseMock({
      mainResult: {
        data: [{ id: 1 }],
        error: null,
        count: 42,
      },
      distinctResults: {
        source: {
          data: [{ source: 'mal' }, { source: ' igdb ' }, { source: 'mal' }, { source: '' }],
          error: null,
        },
        category: {
          data: [{ category: 'games' }, { category: 'anime' }, { category: 'games' }],
          error: null,
        },
        status: {
          data: [{ status: 'released' }, { status: 'ongoing' }],
          error: null,
        },
        format: {
          data: [{ format: 'tv' }, { format: 'movie' }, { format: null }],
          error: null,
        },
      },
    });

    createRouteHandlerClientMock.mockResolvedValue(env.supabase);
    requireAdminRoleMock.mockResolvedValue({});

    const request = new Request(
      'https://example.com/api/admin/media/entries?source=mal&category=anime&status=released&format=tv&q=abc%25_%20x&only_new=1&limit=999&offset=-4',
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([{ id: 1 }]);
    expect(body.meta.total).toBe(42);
    expect(body.meta.limit).toBe(100);
    expect(body.meta.offset).toBe(0);
    expect(body.meta.filters).toEqual({
      source: [' igdb ', 'mal'],
      category: ['anime', 'games'],
      status: ['ongoing', 'released'],
      format: ['movie', 'tv'],
    });

    expect(requireAdminRoleMock).toHaveBeenCalledWith(env.supabase);

    const mainSelectReturn = env.from.mock.results[0].value.select.mock.results[0].value;
    expect(mainSelectReturn.eq).toHaveBeenNthCalledWith(1, 'source', 'mal');
    expect(mainSelectReturn.eq).toHaveBeenNthCalledWith(2, 'category', 'anime');
    expect(mainSelectReturn.eq).toHaveBeenNthCalledWith(3, 'status', 'released');
    expect(mainSelectReturn.eq).toHaveBeenNthCalledWith(4, 'format', 'tv');
    expect(mainSelectReturn.or).toHaveBeenCalledWith(
      'title_english.ilike.%abc\\%\\_ x%,title_romaji.ilike.%abc\\%\\_ x%,title_native.ilike.%abc\\%\\_ x%,description.ilike.%abc\\%\\_ x%',
    );
    expect(mainSelectReturn.gte).toHaveBeenCalledWith('created_at', expect.any(String));
    expect(mainSelectReturn.range).toHaveBeenCalledWith(0, 99);
  });

  it('uses default pagination and returns empty array when data is not array', async () => {
    const env = makeSupabaseMock({
      mainResult: { data: null, error: null, count: null },
    });
    createRouteHandlerClientMock.mockResolvedValue(env.supabase);
    requireAdminRoleMock.mockResolvedValue({});

    const response = await GET(new Request('https://example.com/api/admin/media/entries'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: [],
      meta: {
        total: 0,
        limit: 20,
        offset: 0,
        filters: { source: [], category: [], status: [], format: [] },
      },
    });

    const mainSelectReturn = env.from.mock.results[0].value.select.mock.results[0].value;
    expect(mainSelectReturn.eq).not.toHaveBeenCalled();
    expect(mainSelectReturn.or).not.toHaveBeenCalled();
    expect(mainSelectReturn.gte).not.toHaveBeenCalled();
    expect(mainSelectReturn.range).toHaveBeenCalledWith(0, 19);
  });

  it('falls back to default limit when limit is non-numeric and handles null distinct data', async () => {
    const env = makeSupabaseMock({
      mainResult: { data: [{ id: 10 }], error: null, count: 1 },
      distinctResults: {
        source: { data: null, error: null },
      },
    });
    createRouteHandlerClientMock.mockResolvedValue(env.supabase);
    requireAdminRoleMock.mockResolvedValue({});

    const response = await GET(
      new Request('https://example.com/api/admin/media/entries?limit=abc'),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meta.limit).toBe(20);
    expect(body.meta.filters.source).toEqual([]);

    const mainSelectReturn = env.from.mock.results[0].value.select.mock.results[0].value;
    expect(mainSelectReturn.range).toHaveBeenCalledWith(0, 19);
  });

  it('returns internal error when main query returns error', async () => {
    const env = makeSupabaseMock({
      mainResult: {
        data: null,
        error: { message: 'db fail' },
        count: 0,
      },
    });
    createRouteHandlerClientMock.mockResolvedValue(env.supabase);
    requireAdminRoleMock.mockResolvedValue({});

    const response = await GET(new Request('https://example.com/api/admin/media/entries'));
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('returns internal error when distinct options query fails', async () => {
    const env = makeSupabaseMock({
      distinctResults: {
        source: { data: null, error: { message: 'boom' } },
      },
    });
    createRouteHandlerClientMock.mockResolvedValue(env.supabase);
    requireAdminRoleMock.mockResolvedValue({});

    const response = await GET(new Request('https://example.com/api/admin/media/entries'));
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('returns unauthorized when auth fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabaseMock().supabase);
    requireAdminRoleMock.mockRejectedValue(new UnauthorizedError());

    const response = await GET(new Request('https://example.com/api/admin/media/entries'));
    expect(response.status).toBe(API_ERRORS.UNAUTHORIZED.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.UNAUTHORIZED);
  });

  it('returns forbidden when role check fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabaseMock().supabase);
    requireAdminRoleMock.mockRejectedValue(new ForbiddenError());

    const response = await GET(new Request('https://example.com/api/admin/media/entries'));
    expect(response.status).toBe(API_ERRORS.FORBIDDEN.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.FORBIDDEN);
  });

  it('returns internal for unexpected top-level errors', async () => {
    createRouteHandlerClientMock.mockRejectedValue(new Error('unexpected'));

    const response = await GET(new Request('https://example.com/api/admin/media/entries'));
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });
});
