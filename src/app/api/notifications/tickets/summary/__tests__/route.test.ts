/**
 * @jest-environment node
 */

import 'whatwg-fetch';

const createRouteHandlerClientMock = jest.fn();
const requireAuthMock = jest.fn();
const getUserSettingsMock = jest.fn();
const hasAnyRoleMock = jest.fn();

jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: (...args: unknown[]) => createRouteHandlerClientMock(...args),
}));

jest.mock('@/lib/api/auth', () => ({
  __esModule: true,
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
  UnauthorizedError: class UnauthorizedError extends Error {},
}));

jest.mock('@/lib/settings', () => ({
  __esModule: true,
  getUserSettings: (...args: unknown[]) => getUserSettingsMock(...args),
}));

jest.mock('@/lib/roles', () => ({
  __esModule: true,
  hasAnyRole: (...args: unknown[]) => hasAnyRoleMock(...args),
}));

jest.mock('@/lib/api/response', () => ({
  __esModule: true,
  ok: jest.fn((body: unknown, init?: ResponseInit) => ({
    status: init?.status ?? 200,
    headers: new Headers((init as { headers?: HeadersInit } | undefined)?.headers),
    json: async () => ({ data: body }),
  })),
  fail: jest.fn((body: unknown, status: number, init?: ResponseInit) => ({
    status,
    headers: new Headers((init as { headers?: HeadersInit } | undefined)?.headers),
    json: async () => body,
  })),
}));

import { GET, dynamic } from '@/app/api/notifications/tickets/summary/route';
import { API_ERRORS } from '@/lib/api/errors';
import { UnauthorizedError } from '@/lib/api/auth';

type SupabaseConfig = {
  userData?: unknown;
  userError?: unknown;
  adminCountData?: unknown;
  adminCountError?: unknown;
  ownTickets?: Array<{ id: string; created_at: string | null }>;
  ownTicketsError?: unknown;
  reads?: Array<{ ticket_id: string; last_read_at: string | null }>;
  readsError?: unknown;
  adminMessages?: Array<{ ticket_id: string; created_at: string | null }>;
  adminMessagesError?: unknown;
};

function makeSupabase(config: SupabaseConfig = {}) {
  const userData = config.userData ?? { roles: ['user'] };
  const hasOwnTickets = Object.prototype.hasOwnProperty.call(config, 'ownTickets');
  const hasReads = Object.prototype.hasOwnProperty.call(config, 'reads');
  const hasAdminMessages = Object.prototype.hasOwnProperty.call(config, 'adminMessages');
  const hasAdminCountData = Object.prototype.hasOwnProperty.call(config, 'adminCountData');

  const ownTickets = hasOwnTickets ? config.ownTickets : [];
  const reads = hasReads ? config.reads : [];
  const adminMessages = hasAdminMessages ? config.adminMessages : [];

  const usersSingle = jest
    .fn()
    .mockResolvedValue({ data: userData, error: config.userError ?? null });
  const usersEq = jest.fn().mockReturnValue({ single: usersSingle });
  const usersSelect = jest.fn().mockReturnValue({ eq: usersEq });

  const ownTicketsEq2 = jest
    .fn()
    .mockResolvedValue({ data: ownTickets, error: config.ownTicketsError ?? null });
  const ownTicketsEq1 = jest.fn().mockReturnValue({ eq: ownTicketsEq2 });
  const ownTicketsSelect = jest.fn().mockReturnValue({ eq: ownTicketsEq1 });

  const readsIn = jest.fn().mockResolvedValue({ data: reads, error: config.readsError ?? null });
  const readsEq = jest.fn().mockReturnValue({ in: readsIn });
  const readsSelect = jest.fn().mockReturnValue({ eq: readsEq });

  const messagesEq2 = jest
    .fn()
    .mockResolvedValue({ data: adminMessages, error: config.adminMessagesError ?? null });
  const messagesEq1 = jest.fn().mockReturnValue({ eq: messagesEq2 });
  const messagesIn = jest.fn().mockReturnValue({ eq: messagesEq1 });
  const messagesSelect = jest.fn().mockReturnValue({ in: messagesIn });

  const from = jest.fn((table: string) => {
    if (table === 'users') {
      return { select: usersSelect };
    }
    if (table === 'support_tickets') {
      return { select: ownTicketsSelect };
    }
    if (table === 'support_ticket_reads') {
      return { select: readsSelect };
    }
    if (table === 'support_messages') {
      return { select: messagesSelect };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  const rpc = jest
    .fn()
    .mockResolvedValue({
      data: hasAdminCountData ? config.adminCountData : 0,
      error: config.adminCountError ?? null,
    });

  return { from, rpc };
}

describe('app/api/notifications/tickets/summary/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    getUserSettingsMock.mockResolvedValue({ ticket_notifications_enabled: true });
    hasAnyRoleMock.mockReturnValue(false);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exports force-dynamic mode', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('returns zero summary when ticket notifications are disabled', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());
    getUserSettingsMock.mockResolvedValueOnce({ ticket_notifications_enabled: false });

    const res = await GET(new Request('http://localhost/api/notifications/tickets/summary'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: {
        unread_count: 0,
        user_unread_count: 0,
        admin_unread_count: 0,
        enabled: false,
      },
    });
  });

  it('returns internal error when user role query fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({ userError: { message: 'roles failed' } }),
    );

    const res = await GET(new Request('http://localhost/api/notifications/tickets/summary'));
    expect(res.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('returns internal error when admin unread rpc fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({ adminCountError: { message: 'rpc failed' } }),
    );
    hasAnyRoleMock.mockReturnValueOnce(true);

    const res = await GET(new Request('http://localhost/api/notifications/tickets/summary'));
    expect(res.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('returns internal error when own tickets query fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({ ownTicketsError: { message: 'tickets failed' } }),
    );

    const res = await GET(new Request('http://localhost/api/notifications/tickets/summary'));
    expect(res.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('returns internal error when reads query fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        ownTickets: [{ id: 't1', created_at: '2026-01-01T00:00:00.000Z' }],
        readsError: { message: 'reads failed' },
      }),
    );

    const res = await GET(new Request('http://localhost/api/notifications/tickets/summary'));
    expect(res.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('returns internal error when admin messages query fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        ownTickets: [{ id: 't1', created_at: '2026-01-01T00:00:00.000Z' }],
        adminMessagesError: { message: 'messages failed' },
      }),
    );

    const res = await GET(new Request('http://localhost/api/notifications/tickets/summary'));
    expect(res.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('returns computed summary for normal user (no admin queue access)', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        ownTickets: [
          { id: 't1', created_at: '2026-01-01T00:00:00.000Z' },
          { id: 't2', created_at: '2026-01-05T00:00:00.000Z' },
        ],
        reads: [{ ticket_id: 't1', last_read_at: '2026-01-02T00:00:00.000Z' }],
        adminMessages: [
          { ticket_id: 't1', created_at: '2026-01-03T00:00:00.000Z' }, // unread (after read)
          { ticket_id: 't1', created_at: '2026-01-01T00:00:00.000Z' }, // read
          { ticket_id: 't2', created_at: '2026-01-06T00:00:00.000Z' }, // unread (fallback created_at)
          { ticket_id: 't2', created_at: null }, // ignored
        ],
      }),
    );
    hasAnyRoleMock.mockReturnValueOnce(false);

    const res = await GET(new Request('http://localhost/api/notifications/tickets/summary'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: {
        unread_count: 2,
        user_unread_count: 2,
        admin_unread_count: 0,
        enabled: true,
      },
    });
  });

  it('returns computed summary for admin queue access and no own tickets', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        adminCountData: 7,
        ownTickets: [],
      }),
    );
    hasAnyRoleMock.mockReturnValueOnce(true);

    const res = await GET(new Request('http://localhost/api/notifications/tickets/summary'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: {
        unread_count: 7,
        user_unread_count: 0,
        admin_unread_count: 7,
        enabled: true,
      },
    });
  });

  it('covers nullish fallbacks for admin count and ownTickets list', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        adminCountData: null,
        ownTickets: null as unknown as Array<{ id: string; created_at: string | null }>,
      }),
    );
    hasAnyRoleMock.mockReturnValueOnce(true);

    const res = await GET(new Request('http://localhost/api/notifications/tickets/summary'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: {
        unread_count: 0,
        user_unread_count: 0,
        admin_unread_count: 0,
        enabled: true,
      },
    });
  });

  it('covers reads/adminMessages nullish loops and ticket created_at fallback branch', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        ownTickets: [{ id: 't-null', created_at: null }],
        reads: null as unknown as Array<{ ticket_id: string; last_read_at: string | null }>,
        adminMessages: null as unknown as Array<{ ticket_id: string; created_at: string | null }>,
      }),
    );

    const res = await GET(new Request('http://localhost/api/notifications/tickets/summary'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: {
        unread_count: 0,
        user_unread_count: 0,
        admin_unread_count: 0,
        enabled: true,
      },
    });
  });

  it('maps UnauthorizedError and unknown errors from outer catch', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('unauthorized'));

    let res = await GET(new Request('http://localhost/api/notifications/tickets/summary'));
    expect(res.status).toBe(API_ERRORS.UNAUTHORIZED.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.UNAUTHORIZED);

    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));
    res = await GET(new Request('http://localhost/api/notifications/tickets/summary'));
    expect(res.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });
});
