/**
 * @jest-environment node
 */

import 'whatwg-fetch';

const createRouteHandlerClientMock = jest.fn();
const requireAuthMock = jest.fn();
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

jest.mock('@/lib/roles', () => ({
  __esModule: true,
  hasAnyRole: (...args: unknown[]) => hasAnyRoleMock(...args),
}));

jest.mock('@/lib/api/response', () => ({
  __esModule: true,
  fail: jest.fn((body: unknown, status: number, init?: ResponseInit) => ({
    status,
    headers: new Headers((init as { headers?: HeadersInit } | undefined)?.headers),
    json: async () => body,
  })),
  ok: jest.fn((body: unknown, init?: ResponseInit) => ({
    status: init?.status ?? 200,
    headers: new Headers((init as { headers?: HeadersInit } | undefined)?.headers),
    json: async () => ({ data: body }),
  })),
}));

import { GET, PATCH, dynamic } from '@/app/api/support/tickets/[id]/route';
import { API_ERRORS } from '@/lib/api/errors';
import { UnauthorizedError } from '@/lib/api/auth';

type SupabaseConfig = {
  userData?: unknown;
  ticketData?: unknown;
  ticketError?: unknown;
  markReadError?: unknown;
  messagesData?: unknown;
  messagesError?: unknown;
  attachmentsData?: unknown;
  attachmentsError?: unknown;
  signedUrlByPath?: Record<string, string | null | undefined>;
  patchData?: unknown;
  patchError?: { message?: string } | null;
};

function makeSupabase(config: SupabaseConfig = {}) {
  const userData = Object.prototype.hasOwnProperty.call(config, 'userData')
    ? config.userData
    : { roles: ['user'] };
  const ticketData = Object.prototype.hasOwnProperty.call(config, 'ticketData')
    ? config.ticketData
    : { id: 't1', user_id: 'u1' };
  const ticketError = config.ticketError ?? null;
  const messagesData = Object.prototype.hasOwnProperty.call(config, 'messagesData')
    ? config.messagesData
    : [{ id: 'm1' }];
  const messagesError = config.messagesError ?? null;
  const attachmentsData = Object.prototype.hasOwnProperty.call(config, 'attachmentsData')
    ? config.attachmentsData
    : [{ id: 'a1', storage_path: 'path/a1' }];
  const attachmentsError = config.attachmentsError ?? null;
  const markReadError = config.markReadError ?? null;
  const patchData = Object.prototype.hasOwnProperty.call(config, 'patchData')
    ? config.patchData
    : { id: 't1', user_archived: true, user_deleted: false };
  const patchError = config.patchError ?? null;

  const usersSingle = jest.fn().mockResolvedValue({ data: userData, error: null });
  const usersEq = jest.fn().mockReturnValue({ single: usersSingle });
  const usersSelect = jest.fn().mockReturnValue({ eq: usersEq });

  const ticketSingle = jest.fn().mockResolvedValue({ data: ticketData, error: ticketError });
  const ticketEqUser = jest.fn().mockReturnValue({ single: ticketSingle });
  const ticketEq = jest.fn().mockImplementation(() => ({
    eq: ticketEqUser,
    single: ticketSingle,
  }));
  const ticketSelect = jest.fn().mockReturnValue({ eq: ticketEq });

  const messagesOrder = jest.fn().mockResolvedValue({ data: messagesData, error: messagesError });
  const messagesEq = jest.fn().mockReturnValue({ order: messagesOrder });
  const messagesSelect = jest.fn().mockReturnValue({ eq: messagesEq });

  const attachmentsOrder = jest
    .fn()
    .mockResolvedValue({ data: attachmentsData, error: attachmentsError });
  const attachmentsEq = jest.fn().mockReturnValue({ order: attachmentsOrder });
  const attachmentsSelect = jest.fn().mockReturnValue({ eq: attachmentsEq });

  const createSignedUrl = jest.fn().mockImplementation((path: string) =>
    Promise.resolve({
      data: {
        signedUrl: config.signedUrlByPath?.[path] ?? null,
      },
    }),
  );
  const storageFrom = jest.fn().mockReturnValue({ createSignedUrl });

  const rpc = jest.fn().mockImplementation((fn: string) => {
    if (fn === 'mark_support_ticket_as_read') {
      return Promise.resolve({ error: markReadError });
    }
    if (fn === 'user_set_support_ticket_flags') {
      return Promise.resolve({ data: patchData, error: patchError });
    }
    return Promise.resolve({ data: null, error: null });
  });

  const from = jest.fn((table: string) => {
    if (table === 'users') {
      return { select: usersSelect };
    }
    if (table === 'support_tickets') {
      return { select: ticketSelect };
    }
    if (table === 'support_messages') {
      return { select: messagesSelect };
    }
    if (table === 'support_attachments') {
      return { select: attachmentsSelect };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    from,
    rpc,
    storage: { from: storageFrom },
    spies: {
      ticketEqUser,
      createSignedUrl,
      rpc,
    },
  };
}

describe('app/api/support/tickets/[id]/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireAuthMock.mockResolvedValue({ user: { id: 'u1' } });
    hasAnyRoleMock.mockReturnValue(false);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exports dynamic metadata', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('GET returns unauthorized on UnauthorizedError', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('no auth'));

    const res = await GET(new Request('http://localhost/api/support/tickets/t1'), {
      params: Promise.resolve({ id: 't1' }),
    });

    expect(res.status).toBe(API_ERRORS.UNAUTHORIZED.status);
  });

  it('GET returns 404 when ticket is missing and applies ownership filter for non-admin', async () => {
    const supabase = makeSupabase({ ticketData: null, ticketError: { message: 'nf' } });
    createRouteHandlerClientMock.mockResolvedValue(supabase);
    hasAnyRoleMock.mockReturnValueOnce(false);

    const res = await GET(new Request('http://localhost/api/support/tickets/t1'), {
      params: Promise.resolve({ id: 't1' }),
    });

    expect(res.status).toBe(API_ERRORS.NOT_FOUND.status);
    expect(supabase.spies.ticketEqUser).toHaveBeenCalledWith('user_id', 'u1');
  });

  it('GET returns 500 when messages or attachments query fails', async () => {
    createRouteHandlerClientMock.mockResolvedValueOnce(
      makeSupabase({
        messagesData: null,
        messagesError: { message: 'messages fail' },
      }),
    );
    let res = await GET(new Request('http://localhost/api/support/tickets/t1'), {
      params: Promise.resolve({ id: 't1' }),
    });
    expect(res.status).toBe(API_ERRORS.INTERNAL.status);

    createRouteHandlerClientMock.mockResolvedValueOnce(
      makeSupabase({
        attachmentsData: null,
        attachmentsError: { message: 'attachments fail' },
      }),
    );
    res = await GET(new Request('http://localhost/api/support/tickets/t1'), {
      params: Promise.resolve({ id: 't1' }),
    });
    expect(res.status).toBe(API_ERRORS.INTERNAL.status);
  });

  it('GET returns ticket detail and maps signed urls (admin path, mark-read error tolerated)', async () => {
    const supabase = makeSupabase({
      userData: { roles: ['admin'] },
      markReadError: { message: 'mark-read failed' },
      attachmentsData: [
        { id: 'a1', storage_path: 'path/a1' },
        { id: 'a2', storage_path: 'path/a2' },
      ],
      signedUrlByPath: {
        'path/a1': 'https://signed/a1',
        'path/a2': null,
      },
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase);
    hasAnyRoleMock.mockReturnValueOnce(true);

    const res = await GET(new Request('http://localhost/api/support/tickets/t1'), {
      params: Promise.resolve({ id: 't1' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.ticket).toEqual({ id: 't1', user_id: 'u1' });
    expect(body.data.messages).toEqual([{ id: 'm1' }]);
    expect(body.data.attachments).toEqual([
      { id: 'a1', storage_path: 'path/a1', signed_url: 'https://signed/a1' },
      { id: 'a2', storage_path: 'path/a2', signed_url: null },
    ]);
    expect(supabase.spies.createSignedUrl).toHaveBeenCalledTimes(2);
  });

  it('GET handles unexpected errors as internal', async () => {
    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));

    const res = await GET(new Request('http://localhost/api/support/tickets/t1'), {
      params: Promise.resolve({ id: 't1' }),
    });

    expect(res.status).toBe(API_ERRORS.INTERNAL.status);
  });

  it('GET normalizes null messages and null attachments to empty arrays', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        messagesData: null,
        attachmentsData: null,
      }),
    );
    hasAnyRoleMock.mockReturnValueOnce(true);

    const res = await GET(new Request('http://localhost/api/support/tickets/t1'), {
      params: Promise.resolve({ id: 't1' }),
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: {
        ticket: { id: 't1', user_id: 'u1' },
        messages: [],
        attachments: [],
      },
    });
  });

  it('PATCH returns 400 for invalid action', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());

    const res = await PATCH(
      new Request('http://localhost/api/support/tickets/t1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'invalid' }),
      }),
      { params: Promise.resolve({ id: 't1' }) },
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid action.' });
  });

  it('PATCH returns forbidden when RPC reports NOT_FOUND_OR_FORBIDDEN', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        patchError: { message: 'NOT_FOUND_OR_FORBIDDEN' },
      }),
    );

    const res = await PATCH(
      new Request('http://localhost/api/support/tickets/t1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'archive' }),
      }),
      { params: Promise.resolve({ id: 't1' }) },
    );

    expect(res.status).toBe(API_ERRORS.FORBIDDEN.status);
  });

  it('PATCH returns internal for generic RPC error and succeeds for archive/unarchive/delete', async () => {
    createRouteHandlerClientMock.mockResolvedValueOnce(
      makeSupabase({
        patchError: { message: 'db down' },
      }),
    );
    let res = await PATCH(
      new Request('http://localhost/api/support/tickets/t1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'archive' }),
      }),
      { params: Promise.resolve({ id: 't1' }) },
    );
    expect(res.status).toBe(API_ERRORS.INTERNAL.status);

    const supabaseArchive = makeSupabase({
      patchData: { id: 't1', user_archived: true, user_deleted: false },
    });
    createRouteHandlerClientMock.mockResolvedValueOnce(supabaseArchive);
    res = await PATCH(
      new Request('http://localhost/api/support/tickets/t1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'archive' }),
      }),
      { params: Promise.resolve({ id: 't1' }) },
    );
    expect(res.status).toBe(200);

    const supabaseUnarchive = makeSupabase({
      patchData: { id: 't1', user_archived: false, user_deleted: false },
    });
    createRouteHandlerClientMock.mockResolvedValueOnce(supabaseUnarchive);
    res = await PATCH(
      new Request('http://localhost/api/support/tickets/t1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'unarchive' }),
      }),
      { params: Promise.resolve({ id: 't1' }) },
    );
    expect(res.status).toBe(200);

    const supabaseDelete = makeSupabase({
      patchData: { id: 't1', user_archived: false, user_deleted: true },
    });
    createRouteHandlerClientMock.mockResolvedValueOnce(supabaseDelete);
    res = await PATCH(
      new Request('http://localhost/api/support/tickets/t1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'delete' }),
      }),
      { params: Promise.resolve({ id: 't1' }) },
    );
    expect(res.status).toBe(200);
  });

  it('PATCH returns internal when RPC error has no message field', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        patchError: {},
      }),
    );

    const res = await PATCH(
      new Request('http://localhost/api/support/tickets/t1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'delete' }),
      }),
      { params: Promise.resolve({ id: 't1' }) },
    );

    expect(res.status).toBe(API_ERRORS.INTERNAL.status);
  });

  it('PATCH handles UnauthorizedError and unexpected errors from catch', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('no auth'));
    let res = await PATCH(
      new Request('http://localhost/api/support/tickets/t1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'archive' }),
      }),
      { params: Promise.resolve({ id: 't1' }) },
    );
    expect(res.status).toBe(API_ERRORS.UNAUTHORIZED.status);

    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));
    res = await PATCH(
      new Request('http://localhost/api/support/tickets/t1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'archive' }),
      }),
      { params: Promise.resolve({ id: 't1' }) },
    );
    expect(res.status).toBe(API_ERRORS.INTERNAL.status);
  });
});
