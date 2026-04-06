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
const getSupabaseServerMock = jest.fn();

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

jest.mock('@/lib/supabase-server', () => ({
  __esModule: true,
  default: () => getSupabaseServerMock(),
}));

import { API_ERRORS } from '@/lib/api/errors';
import { UnauthorizedError } from '@/lib/api/auth';
import { GET, PATCH, DELETE, dynamic } from '@/app/api/admin/support/tickets/[id]/route';

function makeRouteSupabaseMock(config?: {
  userData?: unknown;
  ticketData?: Record<string, unknown> | null;
  ticketError?: unknown;
  markReadError?: unknown;
  messagesData?: Array<Record<string, unknown>> | null;
  messagesError?: unknown;
  attachmentsData?: Array<Record<string, unknown>> | null;
  attachmentsError?: unknown;
  eventsData?: Array<Record<string, unknown>> | null;
  eventsError?: unknown;
  signedUrlByPath?: Record<string, string | null | undefined>;
  currentTicketData?: Record<string, unknown> | null;
  currentTicketError?: unknown;
  updatedTicketData?: Record<string, unknown> | null;
  updateError?: unknown;
  eventInsertError?: unknown;
}) {
  const updates: Array<Record<string, unknown>> = [];
  const eventInserts: Array<Array<Record<string, unknown>>> = [];

  const usersSingle = jest.fn().mockResolvedValue({
    data: config?.userData === undefined ? { roles: ['admin'] } : config.userData,
    error: null,
  });
  const usersEq = jest.fn().mockReturnValue({ single: usersSingle });
  const usersSelect = jest.fn().mockReturnValue({ eq: usersEq });

  const supportTicketsSingle = jest.fn().mockImplementation(() => {
    if (config?.currentTicketData !== undefined || config?.currentTicketError !== undefined) {
      return Promise.resolve({
        data: config?.currentTicketData ?? null,
        error: config?.currentTicketError ?? null,
      });
    }
    return Promise.resolve({
      data: config?.ticketData ?? null,
      error: config?.ticketError ?? null,
    });
  });
  const supportTicketsEq = jest.fn().mockReturnValue({ single: supportTicketsSingle });
  const supportTicketsSelect = jest.fn().mockReturnValue({ eq: supportTicketsEq });

  const supportTicketsUpdateSelectSingle = jest.fn().mockResolvedValue({
    data: config?.updatedTicketData ?? null,
    error: config?.updateError ?? null,
  });
  const supportTicketsUpdateSelect = jest
    .fn()
    .mockReturnValue({ single: supportTicketsUpdateSelectSingle });
  const supportTicketsUpdateEq = jest.fn().mockReturnValue({ select: supportTicketsUpdateSelect });
  const supportTicketsUpdate = jest.fn().mockImplementation((payload: Record<string, unknown>) => {
    updates.push(payload);
    return { eq: supportTicketsUpdateEq };
  });

  const messagesOrder = jest.fn().mockResolvedValue({
    data: config?.messagesData ?? [],
    error: config?.messagesError ?? null,
  });
  const messagesEq = jest.fn().mockReturnValue({ order: messagesOrder });
  const messagesSelect = jest.fn().mockReturnValue({ eq: messagesEq });

  const attachmentsOrder = jest.fn().mockResolvedValue({
    data: config?.attachmentsData ?? [],
    error: config?.attachmentsError ?? null,
  });
  const attachmentsEq = jest.fn().mockReturnValue({ order: attachmentsOrder });
  const attachmentsSelect = jest.fn().mockReturnValue({ eq: attachmentsEq });

  const eventsOrder = jest.fn().mockResolvedValue({
    data: config?.eventsData ?? [],
    error: config?.eventsError ?? null,
  });
  const eventsEq = jest.fn().mockReturnValue({ order: eventsOrder });
  const eventsSelect = jest.fn().mockReturnValue({ eq: eventsEq });
  const eventsInsert = jest.fn().mockImplementation((payload: Array<Record<string, unknown>>) => {
    eventInserts.push(payload);
    return Promise.resolve({ error: config?.eventInsertError ?? null });
  });

  const rpc = jest.fn().mockResolvedValue({ error: config?.markReadError ?? null });

  const createSignedUrl = jest.fn().mockImplementation((path: string) =>
    Promise.resolve({
      data: { signedUrl: config?.signedUrlByPath?.[path] ?? null },
    }),
  );
  const storageFrom = jest.fn().mockReturnValue({ createSignedUrl });

  const from = jest.fn().mockImplementation((table: string) => {
    if (table === 'users') {
      return { select: usersSelect };
    }
    if (table === 'support_tickets') {
      return { select: supportTicketsSelect, update: supportTicketsUpdate };
    }
    if (table === 'support_messages') {
      return { select: messagesSelect };
    }
    if (table === 'support_attachments') {
      return { select: attachmentsSelect };
    }
    if (table === 'support_ticket_events') {
      return { select: eventsSelect, insert: eventsInsert };
    }
    return {};
  });

  return {
    client: {
      from,
      rpc,
      storage: { from: storageFrom },
    },
    spies: {
      updates,
      eventInserts,
      supportTicketsUpdate,
      eventsInsert,
      rpc,
      createSignedUrl,
    },
  };
}

function makeServerSupabaseDeleteMock(deleteError?: unknown) {
  const eq = jest.fn().mockResolvedValue({ error: deleteError ?? null });
  const del = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ delete: del });
  return { from, del, eq };
}

describe('app/api/admin/support/tickets/[id]/route', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    requireAuthMock.mockResolvedValue({ user: { id: 'admin-user' } });
    hasAnyRoleMock.mockReturnValue(true);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('exports route metadata', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('GET returns unauthorized/forbidden/not-found/internal paths', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteSupabaseMock().client);
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError());
    const r1 = await GET(new Request('https://example.com'), {
      params: Promise.resolve({ id: 't1' }),
    });
    expect(r1.status).toBe(API_ERRORS.UNAUTHORIZED.status);

    createRouteHandlerClientMock.mockResolvedValue(makeRouteSupabaseMock().client);
    hasAnyRoleMock.mockReturnValueOnce(false);
    const r2 = await GET(new Request('https://example.com'), {
      params: Promise.resolve({ id: 't1' }),
    });
    expect(r2.status).toBe(API_ERRORS.FORBIDDEN.status);

    createRouteHandlerClientMock.mockResolvedValue(
      makeRouteSupabaseMock({ ticketData: null, ticketError: { message: 'not found' } }).client,
    );
    const r3 = await GET(new Request('https://example.com'), {
      params: Promise.resolve({ id: 't1' }),
    });
    expect(r3.status).toBe(API_ERRORS.NOT_FOUND.status);

    createRouteHandlerClientMock.mockResolvedValue(
      makeRouteSupabaseMock({
        ticketData: { id: 't1' },
        messagesData: null,
        messagesError: { message: 'messages fail' },
      }).client,
    );
    const r4 = await GET(new Request('https://example.com'), {
      params: Promise.resolve({ id: 't1' }),
    });
    expect(r4.status).toBe(API_ERRORS.INTERNAL.status);
  });

  it('GET returns internal on attachments/events errors', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeRouteSupabaseMock({
        ticketData: { id: 't1' },
        messagesData: [],
        attachmentsData: null,
        attachmentsError: { message: 'attachments fail' },
      }).client,
    );
    const r1 = await GET(new Request('https://example.com'), {
      params: Promise.resolve({ id: 't1' }),
    });
    expect(r1.status).toBe(API_ERRORS.INTERNAL.status);

    createRouteHandlerClientMock.mockResolvedValue(
      makeRouteSupabaseMock({
        ticketData: { id: 't1' },
        messagesData: [],
        attachmentsData: [],
        eventsData: null,
        eventsError: { message: 'events fail' },
      }).client,
    );
    const r2 = await GET(new Request('https://example.com'), {
      params: Promise.resolve({ id: 't1' }),
    });
    expect(r2.status).toBe(API_ERRORS.INTERNAL.status);
  });

  it('GET success returns ticket data, signed attachment urls, and tolerates mark-read failure', async () => {
    const supabase = makeRouteSupabaseMock({
      ticketData: { id: 't1', status: 'open' },
      markReadError: { message: 'mark read fail' },
      messagesData: [{ id: 'm1' }],
      attachmentsData: [
        { id: 'a1', storage_path: 'p/one' },
        { id: 'a2', storage_path: 'p/two' },
      ],
      eventsData: [{ id: 'e1' }],
      signedUrlByPath: { 'p/one': 'https://signed/one', 'p/two': null },
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase.client);

    const response = await GET(new Request('https://example.com'), {
      params: Promise.resolve({ id: 't1' }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      ticket: { id: 't1' },
      messages: [{ id: 'm1' }],
      events: [{ id: 'e1' }],
    });
    expect(body.data.attachments).toEqual([
      expect.objectContaining({ id: 'a1', signed_url: 'https://signed/one' }),
      expect.objectContaining({ id: 'a2', signed_url: null }),
    ]);
    expect(supabase.spies.rpc).toHaveBeenCalledWith('mark_support_ticket_as_read', {
      p_ticket_id: 't1',
    });
  });

  it('GET handles unexpected errors as internal', async () => {
    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));
    const response = await GET(new Request('https://example.com'), {
      params: Promise.resolve({ id: 't1' }),
    });
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
  });

  it('GET success normalizes null messages/attachments/events to empty arrays', async () => {
    const supabase = makeRouteSupabaseMock({
      ticketData: { id: 't-nulls' },
      messagesData: null,
      attachmentsData: null,
      eventsData: null,
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase.client);

    const response = await GET(new Request('https://example.com'), {
      params: Promise.resolve({ id: 't-nulls' }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      ticket: { id: 't-nulls' },
      messages: [],
      attachments: [],
      events: [],
    });
    expect(supabase.spies.createSignedUrl).not.toHaveBeenCalled();
  });

  it('PATCH returns unauthorized/forbidden/not-found', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteSupabaseMock().client);
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError());
    const r1 = await PATCH(new Request('https://example.com', { method: 'PATCH', body: '{}' }), {
      params: Promise.resolve({ id: 't1' }),
    });
    expect(r1.status).toBe(API_ERRORS.UNAUTHORIZED.status);

    createRouteHandlerClientMock.mockResolvedValue(makeRouteSupabaseMock().client);
    hasAnyRoleMock.mockReturnValueOnce(false);
    const r2 = await PATCH(new Request('https://example.com', { method: 'PATCH', body: '{}' }), {
      params: Promise.resolve({ id: 't1' }),
    });
    expect(r2.status).toBe(API_ERRORS.FORBIDDEN.status);

    createRouteHandlerClientMock.mockResolvedValue(
      makeRouteSupabaseMock({
        currentTicketData: null,
        currentTicketError: { message: 'missing' },
      }).client,
    );
    const r3 = await PATCH(new Request('https://example.com', { method: 'PATCH', body: '{}' }), {
      params: Promise.resolve({ id: 't1' }),
    });
    expect(r3.status).toBe(API_ERRORS.NOT_FOUND.status);
  });

  it('PATCH returns unchanged ticket when no effective updates', async () => {
    const current = { status: 'open', assigned_to: 'u1', labels: ['a', 'b'] };
    const supabase = makeRouteSupabaseMock({ currentTicketData: current });
    createRouteHandlerClientMock.mockResolvedValue(supabase.client);

    const response = await PATCH(
      new Request('https://example.com', {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'invalid-status',
          assigned_to: 'u1',
          labels: ['b', 'a'],
        }),
      }),
      { params: Promise.resolve({ id: 't1' }) },
    );

    expect(response.status).toBe(200);
    expect((await response.json()).data.ticket).toEqual(current);
    expect(supabase.spies.supportTicketsUpdate).not.toHaveBeenCalled();
  });

  it('PATCH updates status/assignment/labels and writes event history', async () => {
    const supabase = makeRouteSupabaseMock({
      currentTicketData: { status: 'open', assigned_to: null, labels: ['old'] },
      updatedTicketData: { id: 't1', status: 'closed', assigned_to: 'agent-1', labels: ['new'] },
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase.client);

    const response = await PATCH(
      new Request('https://example.com', {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'closed',
          assigned_to: 'agent-1',
          labels: ['new'],
        }),
      }),
      { params: Promise.resolve({ id: 't1' }) },
    );

    expect(response.status).toBe(200);
    expect(supabase.spies.updates[0]).toMatchObject({
      status: 'closed',
      assigned_to: 'agent-1',
      labels: ['new'],
    });
    expect(supabase.spies.eventInserts[0]).toHaveLength(3);
    expect(supabase.spies.eventInserts[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ticket_id: 't1',
          type: 'status_change',
          actor_user_id: 'admin-user',
        }),
        expect.objectContaining({ ticket_id: 't1', type: 'assignment' }),
        expect.objectContaining({ ticket_id: 't1', type: 'label_change' }),
      ]),
    );
  });

  it('PATCH supports assigned_to nulling and update failure path', async () => {
    const s1 = makeRouteSupabaseMock({
      currentTicketData: { status: 'open', assigned_to: 'agent-x', labels: [] },
      updatedTicketData: { id: 't1', status: 'open', assigned_to: null, labels: [] },
    });
    createRouteHandlerClientMock.mockResolvedValueOnce(s1.client);
    const r1 = await PATCH(
      new Request('https://example.com', {
        method: 'PATCH',
        body: JSON.stringify({ assigned_to: null }),
      }),
      { params: Promise.resolve({ id: 't1' }) },
    );
    expect(r1.status).toBe(200);
    expect(s1.spies.updates[0]).toMatchObject({ assigned_to: null });

    const s2 = makeRouteSupabaseMock({
      currentTicketData: { status: 'open', assigned_to: null, labels: [] },
      updatedTicketData: null,
      updateError: { message: 'update fail' },
    });
    createRouteHandlerClientMock.mockResolvedValueOnce(s2.client);
    const r2 = await PATCH(
      new Request('https://example.com', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'closed' }),
      }),
      { params: Promise.resolve({ id: 't1' }) },
    );
    expect(r2.status).toBe(API_ERRORS.INTERNAL.status);
  });

  it('PATCH handles label-change when current labels are null', async () => {
    const supabase = makeRouteSupabaseMock({
      currentTicketData: { status: 'open', assigned_to: null, labels: null },
      updatedTicketData: { id: 't1', status: 'open', assigned_to: null, labels: ['new-label'] },
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase.client);

    const response = await PATCH(
      new Request('https://example.com', {
        method: 'PATCH',
        body: JSON.stringify({ labels: ['new-label'] }),
      }),
      { params: Promise.resolve({ id: 't1' }) },
    );

    expect(response.status).toBe(200);
    expect(supabase.spies.updates[0]).toMatchObject({ labels: ['new-label'] });
    expect(supabase.spies.eventInserts[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'label_change',
          payload: { from: [], to: ['new-label'] },
        }),
      ]),
    );
  });

  it('PATCH handles unexpected errors as internal', async () => {
    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));
    const response = await PATCH(
      new Request('https://example.com', { method: 'PATCH', body: '{}' }),
      {
        params: Promise.resolve({ id: 't1' }),
      },
    );
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
  });

  it('DELETE returns unauthorized/forbidden/internal and success', async () => {
    const server1 = makeServerSupabaseDeleteMock();
    getSupabaseServerMock.mockReturnValue(server1);
    createRouteHandlerClientMock.mockResolvedValue(makeRouteSupabaseMock().client);
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError());
    const r1 = await DELETE(new Request('https://example.com', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 't1' }),
    });
    expect(r1.status).toBe(API_ERRORS.UNAUTHORIZED.status);

    const server2 = makeServerSupabaseDeleteMock();
    getSupabaseServerMock.mockReturnValue(server2);
    createRouteHandlerClientMock.mockResolvedValue(makeRouteSupabaseMock().client);
    hasAnyRoleMock.mockReturnValueOnce(false);
    const r2 = await DELETE(new Request('https://example.com', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 't1' }),
    });
    expect(r2.status).toBe(API_ERRORS.FORBIDDEN.status);

    const server3 = makeServerSupabaseDeleteMock({ message: 'delete fail' });
    getSupabaseServerMock.mockReturnValue(server3);
    createRouteHandlerClientMock.mockResolvedValue(makeRouteSupabaseMock().client);
    const r3 = await DELETE(new Request('https://example.com', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 't1' }),
    });
    expect(r3.status).toBe(API_ERRORS.INTERNAL.status);

    const server4 = makeServerSupabaseDeleteMock();
    getSupabaseServerMock.mockReturnValue(server4);
    createRouteHandlerClientMock.mockResolvedValue(makeRouteSupabaseMock().client);
    const r4 = await DELETE(new Request('https://example.com', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 't1' }),
    });
    expect(r4.status).toBe(200);
    await expect(r4.json()).resolves.toEqual({
      data: { message: 'Ticket was permanently deleted.' },
    });
  });

  it('DELETE handles unexpected errors as internal', async () => {
    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));
    const response = await DELETE(new Request('https://example.com', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 't1' }),
    });
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
  });
});
