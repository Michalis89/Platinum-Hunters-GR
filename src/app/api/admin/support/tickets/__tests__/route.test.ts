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
const hasAnyRoleMock = jest.fn();

jest.mock('@/lib/supabase-route-handler', () => ({
  createRouteHandlerClient: () => createRouteHandlerClientMock(),
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

import { API_ERRORS } from '@/lib/api/errors';
import { UnauthorizedError } from '@/lib/api/auth';
import { GET, dynamic } from '@/app/api/admin/support/tickets/route';

function makeSupabaseMock(config?: {
  userRoles?: unknown;
  userError?: unknown;
  ticketsData?: Array<Record<string, unknown>> | null;
  ticketsError?: unknown;
  ticketsCount?: number | null;
  readsData?: Array<Record<string, unknown>> | null;
  readsError?: unknown;
  messagesData?: Array<Record<string, unknown>> | null;
  messagesError?: unknown;
}) {
  const ticketQuery = {
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    then: jest.fn((resolve: (v: unknown) => unknown) =>
      Promise.resolve(
        resolve({
          data: config?.ticketsData ?? [],
          error: config?.ticketsError ?? null,
          count: config?.ticketsCount ?? 0,
        }),
      ),
    ),
  };

  const readsQuery = {
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    then: jest.fn((resolve: (v: unknown) => unknown) =>
      Promise.resolve(
        resolve({
          data: config?.readsData ?? [],
          error: config?.readsError ?? null,
        }),
      ),
    ),
  };

  const messagesQuery = {
    in: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    then: jest.fn((resolve: (v: unknown) => unknown) =>
      Promise.resolve(
        resolve({
          data: config?.messagesData ?? [],
          error: config?.messagesError ?? null,
        }),
      ),
    ),
  };

  const usersSelect = jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({
        data: config?.userRoles === undefined ? { roles: ['admin'] } : { roles: config.userRoles },
        error: config?.userError ?? null,
      }),
    }),
  });

  const supportTicketsSelect = jest.fn().mockReturnValue(ticketQuery);
  const readsSelect = jest.fn().mockReturnValue(readsQuery);
  const messagesSelect = jest.fn().mockReturnValue(messagesQuery);

  const from = jest.fn().mockImplementation((table: string) => {
    if (table === 'users') {
      return { select: usersSelect };
    }
    if (table === 'support_tickets') {
      return { select: supportTicketsSelect };
    }
    if (table === 'support_ticket_reads') {
      return { select: readsSelect };
    }
    if (table === 'support_messages') {
      return { select: messagesSelect };
    }
    return {};
  });

  return {
    client: { from },
    spies: {
      usersSelect,
      supportTicketsSelect,
      readsSelect,
      messagesSelect,
      ticketQuery,
      readsQuery,
      messagesQuery,
    },
  };
}

describe('app/api/admin/support/tickets/route', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    hasAnyRoleMock.mockReturnValue(true);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('exports route metadata', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('returns forbidden for users without admin/owner/moderator roles', async () => {
    const supabase = makeSupabaseMock({ userRoles: ['user'] });
    createRouteHandlerClientMock.mockResolvedValue(supabase.client);
    hasAnyRoleMock.mockReturnValue(false);

    const response = await GET(new Request('https://example.com/api/admin/support/tickets'));
    expect(response.status).toBe(API_ERRORS.FORBIDDEN.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.FORBIDDEN);
  });

  it('returns unauthorized when requireAuth throws UnauthorizedError', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabaseMock().client);
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError());

    const response = await GET(new Request('https://example.com/api/admin/support/tickets'));
    expect(response.status).toBe(API_ERRORS.UNAUTHORIZED.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.UNAUTHORIZED);
  });

  it('applies filters and returns enriched tickets with unread counts', async () => {
    const supabase = makeSupabaseMock({
      ticketsData: [
        {
          id: 't1',
          category: 'bug',
          subject: 'First',
          status: 'open',
          severity: 'high',
          created_at: '2024-01-01T10:00:00.000Z',
          updated_at: '2024-01-02T10:00:00.000Z',
        },
        {
          id: 't2',
          category: 'feature',
          subject: 'Second',
          status: 'in_progress',
          severity: 'low',
          created_at: '2024-01-03T10:00:00.000Z',
          updated_at: '2024-01-04T10:00:00.000Z',
        },
      ],
      ticketsCount: 2,
      readsData: [{ ticket_id: 't1', last_read_at: '2024-01-02T09:00:00.000Z' }],
      messagesData: [
        { ticket_id: 't1', created_at: '2024-01-02T08:00:00.000Z' },
        { ticket_id: 't1', created_at: '2024-01-02T10:30:00.000Z' },
        { ticket_id: 't2', created_at: '2024-01-03T11:00:00.000Z' },
      ],
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase.client);

    const response = await GET(
      new Request(
        'https://example.com/api/admin/support/tickets?status=open&category=bug&severity=high&q=test&date_from=2024-01-01&date_to=2024-12-31&limit=200&offset=-5',
      ),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveLength(2);
    expect(body.meta).toEqual({ total: 2, limit: 100, offset: 0 });
    expect(body.data[0]).toMatchObject({ id: 't1', unread_count: 1, is_unread: true });
    expect(body.data[1]).toMatchObject({ id: 't2', unread_count: 1, is_unread: true });

    expect(supabase.spies.ticketQuery.eq).toHaveBeenCalledWith('status', 'open');
    expect(supabase.spies.ticketQuery.eq).toHaveBeenCalledWith('category', 'bug');
    expect(supabase.spies.ticketQuery.eq).toHaveBeenCalledWith('severity', 'high');
    expect(supabase.spies.ticketQuery.gte).toHaveBeenCalledWith('created_at', '2024-01-01');
    expect(supabase.spies.ticketQuery.lte).toHaveBeenCalledWith('created_at', '2024-12-31');
    expect(supabase.spies.ticketQuery.or).toHaveBeenCalledWith(
      'subject.ilike.%test%,description.ilike.%test%',
    );
    expect(supabase.spies.ticketQuery.range).toHaveBeenCalledWith(0, 99);
  });

  it('ignores invalid filter values and uses default pagination', async () => {
    const supabase = makeSupabaseMock({ ticketsData: [], ticketsCount: 0 });
    createRouteHandlerClientMock.mockResolvedValue(supabase.client);

    const response = await GET(
      new Request(
        'https://example.com/api/admin/support/tickets?status=invalid&category=invalid&severity=invalid',
      ),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([]);
    expect(body.meta).toEqual({ total: 0, limit: 50, offset: 0 });
    expect(supabase.spies.ticketQuery.eq).not.toHaveBeenCalledWith('status', 'invalid');
    expect(supabase.spies.ticketQuery.eq).not.toHaveBeenCalledWith('category', 'invalid');
    expect(supabase.spies.ticketQuery.eq).not.toHaveBeenCalledWith('severity', 'invalid');
  });

  it('returns early with empty result when ticket list is empty', async () => {
    const supabase = makeSupabaseMock({ ticketsData: [], ticketsCount: 0 });
    createRouteHandlerClientMock.mockResolvedValue(supabase.client);

    const response = await GET(new Request('https://example.com/api/admin/support/tickets'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([]);
    expect(supabase.spies.readsSelect).not.toHaveBeenCalled();
    expect(supabase.spies.messagesSelect).not.toHaveBeenCalled();
  });

  it('returns internal when support tickets query fails', async () => {
    const supabase = makeSupabaseMock({
      ticketsData: null,
      ticketsError: { message: 'tickets failed' },
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase.client);

    const response = await GET(new Request('https://example.com/api/admin/support/tickets'));
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('returns internal when reads query fails', async () => {
    const supabase = makeSupabaseMock({
      ticketsData: [{ id: 't1', created_at: '2024-01-01T00:00:00.000Z' }],
      readsData: null,
      readsError: { message: 'reads failed' },
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase.client);

    const response = await GET(new Request('https://example.com/api/admin/support/tickets'));
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('returns internal when messages query fails', async () => {
    const supabase = makeSupabaseMock({
      ticketsData: [{ id: 't1', created_at: '2024-01-01T00:00:00.000Z' }],
      readsData: [],
      messagesData: null,
      messagesError: { message: 'messages failed' },
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase.client);

    const response = await GET(new Request('https://example.com/api/admin/support/tickets'));
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('handles null read/message arrays and unread baseline edge cases', async () => {
    const supabase = makeSupabaseMock({
      ticketsData: [
        { id: 'tA', created_at: null, updated_at: '2024-01-01T00:00:00.000Z' },
        {
          id: 'tB',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-02T00:00:00.000Z',
        },
      ],
      ticketsCount: 2,
      readsData: [{ ticket_id: 'tB', last_read_at: null }],
      messagesData: [
        { ticket_id: 'tA', created_at: null },
        { ticket_id: 'tB', created_at: '2024-01-01T00:00:00.000Z' },
        { ticket_id: 'tB', created_at: '2024-01-01T00:00:01.000Z' },
      ],
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase.client);

    const response = await GET(
      new Request('https://example.com/api/admin/support/tickets?limit=1&offset=2'),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.meta).toEqual({ total: 2, limit: 1, offset: 2 });
    expect(body.data[0]).toMatchObject({ id: 'tA', unread_count: 1, is_unread: true });
    expect(body.data[1]).toMatchObject({ id: 'tB', unread_count: 1, is_unread: true });
  });

  it('handles null tickets/reads/messages with zero-total fallback', async () => {
    const supabase = makeSupabaseMock({
      ticketsData: null,
      ticketsCount: null,
      readsData: null,
      messagesData: null,
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase.client);

    const response = await GET(new Request('https://example.com/api/admin/support/tickets'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([]);
    expect(body.meta).toEqual({ total: 0, limit: 50, offset: 0 });
  });

  it('marks ticket as read when no unread messages exist', async () => {
    const supabase = makeSupabaseMock({
      ticketsData: [{ id: 'tRead', created_at: '2024-01-01T00:00:00.000Z' }],
      ticketsCount: 1,
      readsData: [{ ticket_id: 'tRead', last_read_at: '2024-01-01T10:00:00.000Z' }],
      messagesData: [{ ticket_id: 'tRead', created_at: '2024-01-01T09:00:00.000Z' }],
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase.client);

    const response = await GET(new Request('https://example.com/api/admin/support/tickets'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data[0]).toMatchObject({
      id: 'tRead',
      unread_count: 0,
      is_unread: false,
    });
    expect(body.meta).toEqual({ total: 1, limit: 50, offset: 0 });
  });

  it('returns internal for unexpected errors', async () => {
    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));

    const response = await GET(new Request('https://example.com/api/admin/support/tickets'));
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });
});
