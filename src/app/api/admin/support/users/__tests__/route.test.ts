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
const createSupabaseAdminClientMock = jest.fn();
const requireAdminRoleMock = jest.fn();

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
import { GET, dynamic } from '@/app/api/admin/support/users/route';

type MainQueryResult = { data: unknown; error: unknown; count: number | null };
type StatusQueryResult = { data: Array<{ account_status: unknown }> | null; error: unknown };

function makeAdminMock(config?: {
  mainResult?: MainQueryResult;
  statusResult?: StatusQueryResult;
}) {
  const mainResult = config?.mainResult ?? { data: [], error: null, count: 0 };
  const statusResult = config?.statusResult ?? { data: [], error: null };

  const mainQuery = {
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    then: jest.fn((resolve: (v: unknown) => unknown) => Promise.resolve(resolve(mainResult))),
  };

  const statusesQuery = {
    not: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: jest.fn((resolve: (v: unknown) => unknown) => Promise.resolve(resolve(statusResult))),
  };

  const usersSelect = jest
    .fn()
    .mockImplementation((columns: string, opts?: { count?: 'exact' }) =>
      opts?.count === 'exact' ? mainQuery : statusesQuery,
    );

  const from = jest.fn().mockImplementation((table: string) => {
    if (table === 'users') {
      return { select: usersSelect };
    }
    return {};
  });

  return {
    client: { from },
    spies: {
      usersSelect,
      mainQuery,
      statusesQuery,
    },
  };
}

describe('app/api/admin/support/users/route', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    createRouteHandlerClientMock.mockResolvedValue({ auth: {} });
    requireAdminRoleMock.mockResolvedValue({});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('exports route metadata', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('returns unauthorized and forbidden from requireAdminRole', async () => {
    createSupabaseAdminClientMock.mockReturnValue(makeAdminMock().client);

    requireAdminRoleMock.mockRejectedValueOnce(new UnauthorizedError());
    const r1 = await GET(new Request('https://example.com/api/admin/support/users'));
    expect(r1.status).toBe(API_ERRORS.UNAUTHORIZED.status);

    requireAdminRoleMock.mockRejectedValueOnce(new ForbiddenError());
    const r2 = await GET(new Request('https://example.com/api/admin/support/users'));
    expect(r2.status).toBe(API_ERRORS.FORBIDDEN.status);
  });

  it('applies filters and returns users + distinct statuses', async () => {
    const admin = makeAdminMock({
      mainResult: {
        data: [{ id: 'u1', username: 'alice' }],
        error: null,
        count: 1,
      },
      statusResult: {
        data: [
          { account_status: 'active' },
          { account_status: 'pending' },
          { account_status: 'active' },
          { account_status: '  ' },
          { account_status: null },
        ],
        error: null,
      },
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);

    const response = await GET(
      new Request(
        'https://example.com/api/admin/support/users?q=50%_user&role=admin&status=active&limit=999&offset=-10',
      ),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([{ id: 'u1', username: 'alice' }]);
    expect(body.meta).toEqual({
      total: 1,
      limit: 100,
      offset: 0,
      filters: {
        roles: ['user', 'author', 'reviewer', 'moderator', 'admin', 'owner'],
        statuses: ['active', 'pending'],
      },
    });
    expect(admin.spies.mainQuery.contains).toHaveBeenCalledWith('roles', ['admin']);
    expect(admin.spies.mainQuery.eq).toHaveBeenCalledWith('account_status', 'active');
    expect(admin.spies.mainQuery.or).toHaveBeenCalledWith(
      'username.ilike.%50\\%\\_user%,display_name.ilike.%50\\%\\_user%,full_name.ilike.%50\\%\\_user%,email.ilike.%50\\%\\_user%',
    );
    expect(admin.spies.mainQuery.range).toHaveBeenCalledWith(0, 99);
    expect(admin.spies.statusesQuery.not).toHaveBeenCalledWith('account_status', 'is', null);
    expect(admin.spies.statusesQuery.limit).toHaveBeenCalledWith(2000);
  });

  it('ignores invalid role filter and uses default pagination', async () => {
    const admin = makeAdminMock({
      mainResult: { data: [], error: null, count: 0 },
      statusResult: { data: [], error: null },
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);

    const response = await GET(
      new Request('https://example.com/api/admin/support/users?role=invalid&limit=0&offset=-1'),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([]);
    expect(body.meta.limit).toBe(20);
    expect(body.meta.offset).toBe(0);
    expect(admin.spies.mainQuery.contains).not.toHaveBeenCalled();
  });

  it('returns empty array when main query data is not an array and count is null', async () => {
    const admin = makeAdminMock({
      mainResult: { data: null, error: null, count: null },
      statusResult: { data: [], error: null },
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);

    const response = await GET(new Request('https://example.com/api/admin/support/users'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([]);
    expect(body.meta.total).toBe(0);
  });

  it('returns internal when main users query fails', async () => {
    const admin = makeAdminMock({
      mainResult: { data: null, error: { message: 'main fail' }, count: null },
      statusResult: { data: [], error: null },
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);

    const response = await GET(new Request('https://example.com/api/admin/support/users'));
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('returns internal when statuses query fails', async () => {
    const admin = makeAdminMock({
      mainResult: { data: [], error: null, count: 0 },
      statusResult: { data: null, error: { message: 'status fail' } },
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);

    const response = await GET(new Request('https://example.com/api/admin/support/users'));
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('returns internal on unexpected errors', async () => {
    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));
    createSupabaseAdminClientMock.mockReturnValue(makeAdminMock().client);

    const response = await GET(new Request('https://example.com/api/admin/support/users'));
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('filters out whitespace-only statuses from distinct status options', async () => {
    const admin = makeAdminMock({
      mainResult: { data: [], error: null, count: 0 },
      statusResult: {
        data: [{ account_status: '   ' }, { account_status: '\t' }, { account_status: 'active' }],
        error: null,
      },
    });
    createSupabaseAdminClientMock.mockReturnValue(admin.client);

    const response = await GET(new Request('https://example.com/api/admin/support/users'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.meta.filters.statuses).toEqual(['active']);
  });
});
