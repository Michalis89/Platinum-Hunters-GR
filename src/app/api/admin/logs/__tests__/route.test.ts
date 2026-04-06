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
const createSupabaseAdminClientMock = jest.fn();

jest.mock('@/lib/supabase-route-handler', () => ({
  createRouteHandlerClient: () => createRouteHandlerClientMock(),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => createSupabaseAdminClientMock(),
}));

jest.mock('@/lib/api/auth', () => ({
  UnauthorizedError: class UnauthorizedError extends Error {
    code = 'UNAUTHORIZED';
  },
}));

jest.mock('@/lib/api/permissions', () => ({
  ForbiddenError: class ForbiddenError extends Error {
    code = 'FORBIDDEN';
  },
  requireAdminRole: (...args: unknown[]) => requireAdminRoleMock(...args),
}));

import { API_ERRORS } from '@/lib/api/errors';
import { UnauthorizedError } from '@/lib/api/auth';
import { ForbiddenError } from '@/lib/api/permissions';
import { GET, dynamic } from '@/app/api/admin/logs/route';

type QueryMock = {
  data: unknown;
  error: unknown;
  count: number | null;
  select: jest.Mock;
  order: jest.Mock;
  range: jest.Mock;
  eq: jest.Mock;
  ilike: jest.Mock;
  or: jest.Mock;
};

function makeQueryMock({
  data = [],
  error = null,
  count = 0,
}: { data?: unknown; error?: unknown; count?: number | null } = {}): QueryMock {
  const query: QueryMock = {
    data,
    error,
    count,
    select: jest.fn(),
    order: jest.fn(),
    range: jest.fn(),
    eq: jest.fn(),
    ilike: jest.fn(),
    or: jest.fn(),
  };

  query.select.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.range.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.ilike.mockReturnValue(query);
  query.or.mockReturnValue(query);

  return query;
}

describe('app/api/admin/logs/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createRouteHandlerClientMock.mockResolvedValue({ auth: {} });
    requireAdminRoleMock.mockResolvedValue({});
  });

  it('exports force-dynamic mode', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('returns logs with meta and applies filters with bounded pagination', async () => {
    const query = makeQueryMock({ data: [{ id: '1' }], count: 33 });
    createSupabaseAdminClientMock.mockReturnValue({
      from: jest.fn().mockReturnValue(query),
    });

    const response = await GET(
      new Request(
        'https://example.com/api/admin/logs?level=warn&q=timeout&path=/api/admin&limit=999&offset=-2',
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [{ id: '1' }],
      meta: { total: 33, limit: 200, offset: 0 },
    });

    expect(query.select).toHaveBeenCalled();
    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(query.range).toHaveBeenCalledWith(0, 199);
    expect(query.eq).toHaveBeenCalledWith('level', 'warn');
    expect(query.ilike).toHaveBeenCalledWith('path', '%/api/admin%');
    expect(query.or).toHaveBeenCalledWith(
      'message.ilike.%timeout%,source.ilike.%timeout%,path.ilike.%timeout%',
    );
  });

  it('ignores invalid level and returns defaults for null data/count', async () => {
    const query = makeQueryMock({ data: null, count: null });
    createSupabaseAdminClientMock.mockReturnValue({
      from: jest.fn().mockReturnValue(query),
    });

    const response = await GET(new Request('https://example.com/api/admin/logs?level=debug'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [],
      meta: { total: 0, limit: 50, offset: 0 },
    });

    expect(query.eq).not.toHaveBeenCalled();
    expect(query.ilike).not.toHaveBeenCalled();
    expect(query.or).not.toHaveBeenCalled();
    expect(query.range).toHaveBeenCalledWith(0, 49);
  });

  it('returns internal error when database query returns error', async () => {
    const query = makeQueryMock({ error: { message: 'db fail' } });
    createSupabaseAdminClientMock.mockReturnValue({
      from: jest.fn().mockReturnValue(query),
    });

    const response = await GET(new Request('https://example.com/api/admin/logs'));

    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('returns unauthorized when auth check fails', async () => {
    requireAdminRoleMock.mockRejectedValue(new UnauthorizedError());

    const response = await GET(new Request('https://example.com/api/admin/logs'));

    expect(response.status).toBe(API_ERRORS.UNAUTHORIZED.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.UNAUTHORIZED);
  });

  it('returns forbidden when admin role check fails', async () => {
    requireAdminRoleMock.mockRejectedValue(new ForbiddenError());

    const response = await GET(new Request('https://example.com/api/admin/logs'));

    expect(response.status).toBe(API_ERRORS.FORBIDDEN.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.FORBIDDEN);
  });

  it('returns internal error for unexpected exceptions', async () => {
    createRouteHandlerClientMock.mockRejectedValue(new Error('unexpected'));

    const response = await GET(new Request('https://example.com/api/admin/logs'));

    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });
});
