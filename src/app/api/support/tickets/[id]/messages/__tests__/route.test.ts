/**
 * @jest-environment node
 */

import 'whatwg-fetch';

const createRouteHandlerClientMock = jest.fn();
const requireAuthMock = jest.fn();
const getSupabaseServerMock = jest.fn();

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

jest.mock('@/lib/supabase-server', () => ({
  __esModule: true,
  default: (...args: unknown[]) => getSupabaseServerMock(...args),
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

import { POST } from '@/app/api/support/tickets/[id]/messages/route';
import { API_ERRORS } from '@/lib/api/errors';
import { UnauthorizedError } from '@/lib/api/auth';

function makeRequest(formData: FormData) {
  return {
    formData: async () => formData,
  } as unknown as Request;
}

type SupabaseOpts = {
  ticketData?: unknown;
  ticketError?: unknown;
  messageData?: unknown;
  messageError?: unknown;
  attachmentInsertError?: unknown;
};

function makeSupabase(opts: SupabaseOpts = {}) {
  const ticketData = opts.ticketData ?? { id: 't1', status: 'open', user_id: 'user-1' };
  const ticketError = opts.ticketError ?? null;
  const messageData = opts.messageData ?? { id: 'm1' };
  const messageError = opts.messageError ?? null;
  const attachmentInsertError = opts.attachmentInsertError ?? null;

  const ticketSingle = jest.fn().mockResolvedValue({ data: ticketData, error: ticketError });
  const ticketEq = jest.fn().mockReturnValue({ single: ticketSingle });
  const ticketSelect = jest.fn().mockReturnValue({ eq: ticketEq });

  const messageSingle = jest.fn().mockResolvedValue({ data: messageData, error: messageError });
  const messageSelect = jest.fn().mockReturnValue({ single: messageSingle });
  const messageInsert = jest.fn().mockReturnValue({ select: messageSelect });

  const attachmentInsert = jest.fn().mockResolvedValue({ error: attachmentInsertError });

  const ticketUpdateEq = jest.fn().mockResolvedValue({ error: null });
  const ticketUpdate = jest.fn().mockReturnValue({ eq: ticketUpdateEq });

  const from = jest.fn((table: string) => {
    if (table === 'support_tickets') {
      return {
        select: ticketSelect,
        update: ticketUpdate,
      };
    }
    if (table === 'support_messages') {
      return { insert: messageInsert };
    }
    if (table === 'support_attachments') {
      return { insert: attachmentInsert };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    from,
    spies: {
      ticketSelect,
      ticketSingle,
      messageInsert,
      messageSingle,
      attachmentInsert,
      ticketUpdate,
      ticketUpdateEq,
    },
  };
}

type AdminOpts = {
  uploadError?: unknown;
  removeError?: unknown;
};

function makeAdmin(opts: AdminOpts = {}) {
  const upload = jest.fn().mockResolvedValue({ error: opts.uploadError ?? null });
  const remove = jest.fn().mockResolvedValue({ error: opts.removeError ?? null });
  const storageFrom = jest.fn().mockReturnValue({ upload, remove });

  const updateEq = jest.fn().mockResolvedValue({ error: null });
  const update = jest.fn().mockReturnValue({ eq: updateEq });
  const from = jest.fn().mockReturnValue({ update });

  return {
    storage: { from: storageFrom },
    from,
    spies: { upload, remove, storageFrom, update, updateEq },
  };
}

describe('app/api/support/tickets/[id]/messages/route', () => {
  const originalDateNow = Date.now;

  beforeEach(() => {
    jest.clearAllMocks();
    Date.now = jest.fn(() => 1700000000000);
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    Date.now = originalDateNow;
    jest.restoreAllMocks();
  });

  it('returns unauthorized when auth throws UnauthorizedError', async () => {
    const supabase = makeSupabase();
    createRouteHandlerClientMock.mockResolvedValue(supabase);
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('nope'));

    const form = new FormData();
    form.set('message', 'hello');
    const res = await POST(makeRequest(form), { params: Promise.resolve({ id: 't1' }) });
    expect(res.status).toBe(API_ERRORS.UNAUTHORIZED.status);
  });

  it('returns 400 when message is empty', async () => {
    const supabase = makeSupabase();
    createRouteHandlerClientMock.mockResolvedValue(supabase);

    const form = new FormData();
    form.set('message', '   ');
    const res = await POST(makeRequest(form), { params: Promise.resolve({ id: 't1' }) });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Message is required.' });
  });

  it('returns 400 when message field is missing in form data', async () => {
    const supabase = makeSupabase();
    createRouteHandlerClientMock.mockResolvedValue(supabase);

    const form = new FormData();
    const res = await POST(makeRequest(form), { params: Promise.resolve({ id: 't1' }) });
    expect(res.status).toBe(400);
  });

  it('returns 404 when ticket does not exist', async () => {
    const supabase = makeSupabase({ ticketData: null, ticketError: { message: 'nf' } });
    createRouteHandlerClientMock.mockResolvedValue(supabase);

    const form = new FormData();
    form.set('message', 'hello');
    const res = await POST(makeRequest(form), { params: Promise.resolve({ id: 't1' }) });
    expect(res.status).toBe(API_ERRORS.NOT_FOUND.status);
  });

  it('returns forbidden when ticket belongs to another user', async () => {
    const supabase = makeSupabase({
      ticketData: { id: 't1', status: 'open', user_id: 'other-user' },
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase);

    const form = new FormData();
    form.set('message', 'hello');
    const res = await POST(makeRequest(form), { params: Promise.resolve({ id: 't1' }) });
    expect(res.status).toBe(API_ERRORS.FORBIDDEN.status);
  });

  it('returns attachment validation errors (count, mime, size)', async () => {
    const supabase = makeSupabase();
    createRouteHandlerClientMock.mockResolvedValue(supabase);

    const tooMany = new FormData();
    tooMany.set('message', 'hello');
    for (let i = 0; i < 6; i += 1) {
      tooMany.append('attachments', new File(['a'], `f${i}.png`, { type: 'image/png' }));
    }
    const r1 = await POST(makeRequest(tooMany), { params: Promise.resolve({ id: 't1' }) });
    expect(r1.status).toBe(400);

    const badType = new FormData();
    badType.set('message', 'hello');
    badType.append('attachments', new File(['a'], 'f.txt', { type: 'text/plain' }));
    const r2 = await POST(makeRequest(badType), { params: Promise.resolve({ id: 't1' }) });
    expect(r2.status).toBe(400);

    const big = new FormData();
    big.set('message', 'hello');
    const hugeBuffer = new Uint8Array(5 * 1024 * 1024 + 1);
    big.append('attachments', new File([hugeBuffer], 'big.png', { type: 'image/png' }));
    const r3 = await POST(makeRequest(big), { params: Promise.resolve({ id: 't1' }) });
    expect(r3.status).toBe(400);
  });

  it('returns 500 when message insert fails or message row is empty', async () => {
    const supabase1 = makeSupabase({ messageData: null, messageError: { message: 'insert fail' } });
    createRouteHandlerClientMock.mockResolvedValueOnce(supabase1);

    const form = new FormData();
    form.set('message', 'hello');
    const r1 = await POST(makeRequest(form), { params: Promise.resolve({ id: 't1' }) });
    expect(r1.status).toBe(API_ERRORS.INTERNAL.status);

    const supabase2 = makeSupabase({ messageData: null, messageError: null });
    createRouteHandlerClientMock.mockResolvedValueOnce(supabase2);
    const r2 = await POST(makeRequest(form), { params: Promise.resolve({ id: 't1' }) });
    expect(r2.status).toBe(API_ERRORS.INTERNAL.status);
  });

  it('returns 500 when file upload fails', async () => {
    const supabase = makeSupabase();
    const admin = makeAdmin({ uploadError: { message: 'upload failed' } });
    createRouteHandlerClientMock.mockResolvedValue(supabase);
    getSupabaseServerMock.mockReturnValue(admin);

    const form = new FormData();
    form.set('message', 'hello');
    form.append('attachments', new File(['abc'], 'file.png', { type: 'image/png' }));

    const res = await POST(makeRequest(form), { params: Promise.resolve({ id: 't1' }) });
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'File upload failed.' });
  });

  it('returns internal error and removes uploaded file when attachment insert fails', async () => {
    const supabase = makeSupabase({
      attachmentInsertError: { message: 'insert attachment failed' },
    });
    const admin = makeAdmin();
    createRouteHandlerClientMock.mockResolvedValue(supabase);
    getSupabaseServerMock.mockReturnValue(admin);

    const form = new FormData();
    form.set('message', 'hello');
    form.append('attachments', new File(['abc'], '###', { type: 'image/png' }));
    form.append('attachments', 'non-file-value');

    const res = await POST(makeRequest(form), { params: Promise.resolve({ id: 't1' }) });
    expect(res.status).toBe(API_ERRORS.INTERNAL.status);
    expect(admin.spies.remove).toHaveBeenCalledTimes(1);
    expect(admin.spies.remove.mock.calls[0][0][0]).toContain('attachment.');
  });

  it('returns 201 on success with attachments and moves ticket to in_progress when status is open/waiting_user', async () => {
    const openTicketSupabase = makeSupabase({
      ticketData: { id: 't1', status: 'open', user_id: 'user-1' },
      messageData: { id: 'm-open' },
    });
    const waitingTicketSupabase = makeSupabase({
      ticketData: { id: 't1', status: 'waiting_user', user_id: 'user-1' },
      messageData: { id: 'm-wait' },
    });
    const admin = makeAdmin();
    createRouteHandlerClientMock
      .mockResolvedValueOnce(openTicketSupabase)
      .mockResolvedValueOnce(waitingTicketSupabase);
    getSupabaseServerMock.mockReturnValue(admin);

    const form = new FormData();
    form.set('message', 'hello');
    form.append('attachments', new File(['abc'], 'my image.png', { type: 'image/png' }));
    form.append('attachments', new File(['abc'], 'trailing-dot.', { type: 'image/png' }));

    const r1 = await POST(makeRequest(form), { params: Promise.resolve({ id: 't1' }) });
    expect(r1.status).toBe(201);
    await expect(r1.json()).resolves.toEqual({ data: { message_id: 'm-open' } });
    expect(admin.spies.upload).toHaveBeenCalled();
    expect(admin.spies.update).toHaveBeenCalledWith({ status: 'in_progress' });
    const lastUploadPath = admin.spies.upload.mock.calls[1][0] as string;
    expect(lastUploadPath).toContain('-trailing-dot.');

    const r2 = await POST(makeRequest(form), { params: Promise.resolve({ id: 't1' }) });
    expect(r2.status).toBe(201);
    expect(admin.spies.update).toHaveBeenCalledWith({ status: 'in_progress' });
  });

  it('does not update ticket status when ticket is closed and returns success without attachments', async () => {
    const supabase = makeSupabase({
      ticketData: { id: 't1', status: 'closed', user_id: 'user-1' },
      messageData: { id: 'm-closed' },
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase);

    const form = new FormData();
    form.set('message', 'hello');
    const res = await POST(makeRequest(form), { params: Promise.resolve({ id: 't1' }) });

    expect(res.status).toBe(201);
    expect(supabase.spies.ticketUpdate).not.toHaveBeenCalled();
  });

  it('returns internal fail for unexpected errors', async () => {
    const supabase = makeSupabase();
    createRouteHandlerClientMock.mockResolvedValue(supabase);

    const badReq = {
      formData: async () => {
        throw new Error('boom');
      },
    } as unknown as Request;

    const res = await POST(badReq, { params: Promise.resolve({ id: 't1' }) });
    expect(res.status).toBe(API_ERRORS.INTERNAL.status);
  });
});
