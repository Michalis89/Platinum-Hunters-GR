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
import {
  POST,
  runtime,
  dynamic,
  maxDuration,
} from '@/app/api/admin/support/tickets/[id]/reply/route';

function makeRouteSupabaseMock(config?: {
  userData?: unknown;
  ticketData?: Record<string, unknown> | null;
  ticketError?: unknown;
  messageData?: Record<string, unknown> | null;
  messageError?: unknown;
  attachmentInsertError?: unknown;
  updateError?: unknown;
  eventInsertError?: unknown;
}) {
  const messageInsertPayloads: Array<Record<string, unknown>> = [];
  const attachmentInsertPayloads: Array<Record<string, unknown>> = [];
  const ticketUpdatePayloads: Array<Record<string, unknown>> = [];
  const eventInsertPayloads: Array<Record<string, unknown>> = [];

  const usersSingle = jest.fn().mockResolvedValue({
    data: config?.userData === undefined ? { roles: ['admin'] } : config.userData,
    error: null,
  });
  const usersEq = jest.fn().mockReturnValue({ single: usersSingle });
  const usersSelect = jest.fn().mockReturnValue({ eq: usersEq });

  const ticketsSingle = jest.fn().mockResolvedValue({
    data: config?.ticketData ?? { id: 't1', status: 'open' },
    error: config?.ticketError ?? null,
  });
  const ticketsEqForSelect = jest.fn().mockReturnValue({ single: ticketsSingle });
  const ticketsSelect = jest.fn().mockReturnValue({ eq: ticketsEqForSelect });

  const ticketsUpdateEq = jest.fn().mockResolvedValue({ error: config?.updateError ?? null });
  const ticketsUpdate = jest.fn().mockImplementation((payload: Record<string, unknown>) => {
    ticketUpdatePayloads.push(payload);
    return { eq: ticketsUpdateEq };
  });

  const messagesInsertSelectSingle = jest.fn().mockResolvedValue({
    data: config?.messageData ?? { id: 'm1' },
    error: config?.messageError ?? null,
  });
  const messagesInsertSelect = jest.fn().mockReturnValue({ single: messagesInsertSelectSingle });
  const messagesInsert = jest.fn().mockImplementation((payload: Record<string, unknown>) => {
    messageInsertPayloads.push(payload);
    return { select: messagesInsertSelect };
  });

  const attachmentsInsert = jest.fn().mockImplementation((payload: Record<string, unknown>) => {
    attachmentInsertPayloads.push(payload);
    return Promise.resolve({ error: config?.attachmentInsertError ?? null });
  });

  const eventsInsert = jest.fn().mockImplementation((payload: Record<string, unknown>) => {
    eventInsertPayloads.push(payload);
    return Promise.resolve({ error: config?.eventInsertError ?? null });
  });

  const from = jest.fn().mockImplementation((table: string) => {
    if (table === 'users') {
      return { select: usersSelect };
    }
    if (table === 'support_tickets') {
      return { select: ticketsSelect, update: ticketsUpdate };
    }
    if (table === 'support_messages') {
      return { insert: messagesInsert };
    }
    if (table === 'support_attachments') {
      return { insert: attachmentsInsert };
    }
    if (table === 'support_ticket_events') {
      return { insert: eventsInsert };
    }
    return {};
  });

  return {
    client: { from },
    spies: {
      messageInsertPayloads,
      attachmentInsertPayloads,
      ticketUpdatePayloads,
      eventInsertPayloads,
      eventsInsert,
      attachmentsInsert,
      ticketsUpdate,
    },
  };
}

function makeAdminStorageMock(config?: { uploadError?: unknown; removeError?: unknown }) {
  const remove = jest.fn().mockResolvedValue({ error: config?.removeError ?? null });
  const upload = jest.fn().mockResolvedValue({ error: config?.uploadError ?? null });
  const from = jest.fn().mockReturnValue({ upload, remove });
  return { client: { storage: { from } }, spies: { from, upload, remove } };
}

function makeRequest(formData: FormData): Request {
  return {
    formData: async () => formData,
  } as unknown as Request;
}

function makeTestFile(name: string, type: string, content = 'x'): File {
  const file = new File([content], name, { type });
  const bytes = Buffer.from(content);
  Object.defineProperty(file, 'arrayBuffer', {
    value: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  });
  return file;
}

describe('app/api/admin/support/tickets/[id]/reply/route', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    requireAuthMock.mockResolvedValue({ user: { id: 'admin-user' } });
    hasAnyRoleMock.mockReturnValue(true);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('exports route metadata', () => {
    expect(runtime).toBe('nodejs');
    expect(dynamic).toBe('force-dynamic');
    expect(maxDuration).toBe(60);
  });

  it('returns unauthorized and forbidden from admin guard', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteSupabaseMock().client);
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError());
    const r1 = await POST(makeRequest(new FormData()), { params: Promise.resolve({ id: 't1' }) });
    expect(r1.status).toBe(API_ERRORS.UNAUTHORIZED.status);

    createRouteHandlerClientMock.mockResolvedValue(makeRouteSupabaseMock().client);
    hasAnyRoleMock.mockReturnValueOnce(false);
    const r2 = await POST(makeRequest(new FormData()), { params: Promise.resolve({ id: 't1' }) });
    expect(r2.status).toBe(API_ERRORS.FORBIDDEN.status);
  });

  it('returns 400 when message is empty', async () => {
    const supabase = makeRouteSupabaseMock();
    createRouteHandlerClientMock.mockResolvedValue(supabase.client);

    const form = new FormData();
    form.set('message', '   ');
    const response = await POST(makeRequest(form), { params: Promise.resolve({ id: 't1' }) });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Message is required.' });
  });

  it('returns 400 when message field is missing', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteSupabaseMock().client);
    const form = new FormData();
    const response = await POST(makeRequest(form), { params: Promise.resolve({ id: 't1' }) });
    expect(response.status).toBe(400);
  });

  it('returns not found when ticket does not exist', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeRouteSupabaseMock({ ticketData: null, ticketError: { message: 'missing' } }).client,
    );
    const form = new FormData();
    form.set('message', 'hello');
    const response = await POST(makeRequest(form), { params: Promise.resolve({ id: 't404' }) });
    expect(response.status).toBe(API_ERRORS.NOT_FOUND.status);
  });

  it('returns 400 for attachment count/type/size validation', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteSupabaseMock().client);

    const tooMany = new FormData();
    tooMany.set('message', 'hello');
    for (let i = 0; i < 6; i += 1) {
      tooMany.append('attachments', makeTestFile(`a-${i}.png`, 'image/png'));
    }
    const r1 = await POST(makeRequest(tooMany), { params: Promise.resolve({ id: 't1' }) });
    expect(r1.status).toBe(400);
    await expect(r1.json()).resolves.toEqual({ error: 'You can upload up to 5 files.' });

    const badType = new FormData();
    badType.set('message', 'hello');
    badType.append('attachments', makeTestFile('a.txt', 'text/plain'));
    const r2 = await POST(makeRequest(badType), { params: Promise.resolve({ id: 't1' }) });
    expect(r2.status).toBe(400);

    const big = new FormData();
    big.set('message', 'hello');
    big.append(
      'attachments',
      makeTestFile('big.pdf', 'application/pdf', 'x'.repeat(5 * 1024 * 1024 + 1)),
    );
    const r3 = await POST(makeRequest(big), { params: Promise.resolve({ id: 't1' }) });
    expect(r3.status).toBe(400);
  });

  it('returns internal when support message insert fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeRouteSupabaseMock({ messageData: null, messageError: { message: 'insert fail' } }).client,
    );
    const form = new FormData();
    form.set('message', 'hello');
    const response = await POST(makeRequest(form), { params: Promise.resolve({ id: 't1' }) });
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
  });

  it('handles upload failure and attachment insert failure with cleanup', async () => {
    const routeSupabase1 = makeRouteSupabaseMock();
    const adminStorage1 = makeAdminStorageMock({ uploadError: { message: 'upload fail' } });
    createRouteHandlerClientMock.mockResolvedValueOnce(routeSupabase1.client);
    getSupabaseServerMock.mockReturnValueOnce(adminStorage1.client);

    const f1 = new FormData();
    f1.set('message', 'hello');
    f1.append('attachments', makeTestFile('ok.png', 'image/png'));
    const r1 = await POST(makeRequest(f1), { params: Promise.resolve({ id: 't1' }) });
    expect(r1.status).toBe(500);
    await expect(r1.json()).resolves.toEqual({ error: 'File upload failed.' });

    const routeSupabase2 = makeRouteSupabaseMock({
      attachmentInsertError: { message: 'insert fail' },
    });
    const adminStorage2 = makeAdminStorageMock();
    createRouteHandlerClientMock.mockResolvedValueOnce(routeSupabase2.client);
    getSupabaseServerMock.mockReturnValueOnce(adminStorage2.client);

    const f2 = new FormData();
    f2.set('message', 'hello');
    f2.append('attachments', makeTestFile('###', 'image/png'));
    const r2 = await POST(makeRequest(f2), { params: Promise.resolve({ id: 't1' }) });
    expect(r2.status).toBe(API_ERRORS.INTERNAL.status);
    expect(adminStorage2.spies.remove).toHaveBeenCalledTimes(1);
  });

  it('successfully inserts message + attachments and updates ticket status/event', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    const routeSupabase = makeRouteSupabaseMock({ ticketData: { id: 't1', status: 'open' } });
    const adminStorage = makeAdminStorageMock();
    createRouteHandlerClientMock.mockResolvedValue(routeSupabase.client);
    getSupabaseServerMock.mockReturnValue(adminStorage.client);

    const form = new FormData();
    form.set('message', 'reply text');
    form.set('is_internal', 'on');
    form.append('attachments', makeTestFile('Doc 1.PDF', 'application/pdf', 'pdf'));

    const r1 = await POST(makeRequest(form), { params: Promise.resolve({ id: 't1' }) });
    expect(r1.status).toBe(201);
    await expect(r1.json()).resolves.toEqual({ data: { message_id: 'm1' } });
    expect(routeSupabase.spies.messageInsertPayloads[0]).toMatchObject({
      ticket_id: 't1',
      author_user_id: 'admin-user',
      author_role: 'admin',
      message: 'reply text',
      is_internal: true,
    });
    expect(adminStorage.spies.upload).toHaveBeenCalledWith(
      expect.stringContaining('support/t1/m1/1700000000000-doc-1.pdf'),
      expect.any(Buffer),
      expect.objectContaining({ contentType: 'application/pdf' }),
    );
    expect(routeSupabase.spies.ticketUpdatePayloads).toHaveLength(0);
    (Date.now as jest.Mock).mockRestore();
  });

  it('sets waiting_user status for public replies and skips event insert when update fails', async () => {
    const s1 = makeRouteSupabaseMock({ ticketData: { id: 't1', status: 'open' } });
    createRouteHandlerClientMock.mockResolvedValueOnce(s1.client);
    getSupabaseServerMock.mockReturnValueOnce(makeAdminStorageMock().client);

    const f1 = new FormData();
    f1.set('message', 'public reply');
    const r1 = await POST(makeRequest(f1), { params: Promise.resolve({ id: 't1' }) });
    expect(r1.status).toBe(201);
    expect(s1.spies.messageInsertPayloads[0]).toMatchObject({ is_internal: false });
    expect(s1.spies.ticketUpdatePayloads[0]).toEqual({ status: 'waiting_user' });
    expect(s1.spies.eventInsertPayloads[0]).toMatchObject({
      ticket_id: 't1',
      type: 'status_change',
      actor_user_id: 'admin-user',
    });

    const s2 = makeRouteSupabaseMock({
      ticketData: { id: 't1', status: 'open' },
      updateError: { message: 'update fail' },
    });
    createRouteHandlerClientMock.mockResolvedValueOnce(s2.client);
    getSupabaseServerMock.mockReturnValueOnce(makeAdminStorageMock().client);
    const f2 = new FormData();
    f2.set('message', 'public reply');
    const r2 = await POST(makeRequest(f2), { params: Promise.resolve({ id: 't1' }) });
    expect(r2.status).toBe(201);
    expect(s2.spies.ticketUpdatePayloads[0]).toEqual({ status: 'waiting_user' });
    expect(s2.spies.eventInsertPayloads).toHaveLength(0);

    const s3 = makeRouteSupabaseMock({ ticketData: { id: 't1', status: 'waiting_user' } });
    createRouteHandlerClientMock.mockResolvedValueOnce(s3.client);
    getSupabaseServerMock.mockReturnValueOnce(makeAdminStorageMock().client);
    const f3 = new FormData();
    f3.set('message', 'no status change');
    f3.set('is_internal', 'true');
    const r3 = await POST(makeRequest(f3), { params: Promise.resolve({ id: 't1' }) });
    expect(r3.status).toBe(201);
    expect(s3.spies.ticketUpdatePayloads).toHaveLength(0);
  });

  it('treats non-string is_internal form value as false', async () => {
    const s = makeRouteSupabaseMock({ ticketData: { id: 't1', status: 'open' } });
    createRouteHandlerClientMock.mockResolvedValue(s.client);
    getSupabaseServerMock.mockReturnValue(makeAdminStorageMock().client);

    const form = new FormData();
    form.set('message', 'reply');
    form.set('is_internal', makeTestFile('flag.png', 'image/png'));
    const response = await POST(makeRequest(form), { params: Promise.resolve({ id: 't1' }) });

    expect(response.status).toBe(201);
    expect(s.spies.messageInsertPayloads[0]).toMatchObject({ is_internal: false });
    expect(s.spies.ticketUpdatePayloads[0]).toEqual({ status: 'waiting_user' });
  });

  it('handles string true is_internal and file extension fallback', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1700000001111);
    const s = makeRouteSupabaseMock({ ticketData: { id: 't1', status: 'open' } });
    const adminStorage = makeAdminStorageMock();
    createRouteHandlerClientMock.mockResolvedValue(s.client);
    getSupabaseServerMock.mockReturnValue(adminStorage.client);

    const form = new FormData();
    form.set('message', 'internal');
    form.set('is_internal', 'true');
    form.append('attachments', makeTestFile('noext.', 'image/png'));
    const response = await POST(makeRequest(form), { params: Promise.resolve({ id: 't1' }) });

    expect(response.status).toBe(201);
    expect(s.spies.messageInsertPayloads[0]).toMatchObject({ is_internal: true });
    expect(s.spies.ticketUpdatePayloads).toHaveLength(0);
    expect(adminStorage.spies.upload).toHaveBeenCalledWith(
      expect.stringContaining('/1700000001111-noext.'),
      expect.any(Buffer),
      expect.objectContaining({ contentType: 'image/png' }),
    );
    (Date.now as jest.Mock).mockRestore();
  });

  it('handles unexpected errors as internal', async () => {
    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));
    const form = new FormData();
    form.set('message', 'x');
    const response = await POST(makeRequest(form), { params: Promise.resolve({ id: 't1' }) });
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
  });
});
