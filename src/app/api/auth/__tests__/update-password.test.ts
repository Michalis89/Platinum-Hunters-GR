/**
 * @jest-environment node
 */

import 'whatwg-fetch';

const createRouteHandlerClientMock = jest.fn();
const validatePasswordMock = jest.fn();
const clearAuthCookiesMock = jest.fn();
const isSessionErrorMock = jest.fn();

const getSessionMock = jest.fn();
const updateUserMock = jest.fn();
const signOutMock = jest.fn();

jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: (...args: unknown[]) => createRouteHandlerClientMock(...args),
}));

jest.mock('@/utils/validation/auth', () => ({
  __esModule: true,
  validatePassword: (...args: unknown[]) => validatePasswordMock(...args),
}));

jest.mock('@/lib/api/response', () => ({
  __esModule: true,
  fail: jest.fn((body: unknown, status: number, init?: ResponseInit) => ({
    status,
    headers: new Headers((init as { headers?: HeadersInit } | undefined)?.headers),
    json: async () => body,
  })),
  ok: jest.fn((body: unknown, init?: ResponseInit) => ({
    status: 200,
    headers: new Headers((init as { headers?: HeadersInit } | undefined)?.headers),
    json: async () => ({ data: body }),
  })),
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  clearAuthCookies: (...args: unknown[]) => clearAuthCookiesMock(...args),
  isSessionError: (...args: unknown[]) => isSessionErrorMock(...args),
  SESSION_ERRORS: {
    RECOVERY_EXPIRED: 'Recovery session expired. Please request a new reset link.',
  },
}));

import { POST } from '@/app/api/auth/update-password/route';
import { API_ERRORS } from '@/lib/api/errors';
import { SESSION_ERRORS } from '@/lib/auth';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/update-password', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('app/api/auth/update-password/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validatePasswordMock.mockReturnValue({ isValid: true });
    isSessionErrorMock.mockReturnValue(false);
    clearAuthCookiesMock.mockResolvedValue(undefined);
    getSessionMock.mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null });
    updateUserMock.mockResolvedValue({ error: null });
    signOutMock.mockResolvedValue({ error: null });
    createRouteHandlerClientMock.mockResolvedValue({
      auth: {
        getSession: (...args: unknown[]) => getSessionMock(...args),
        updateUser: (...args: unknown[]) => updateUserMock(...args),
        signOut: (...args: unknown[]) => signOutMock(...args),
      },
    });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 400 when password validation fails with explicit message', async () => {
    validatePasswordMock.mockReturnValueOnce({ isValid: false, error: 'Weak password' });
    const res = await POST(makeRequest({ password: 'x' }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Weak password' });
  });

  it('returns 400 when password validation fails without message', async () => {
    validatePasswordMock.mockReturnValueOnce({ isValid: false });
    const res = await POST(makeRequest({ password: 'x' }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid password format' });
  });

  it('returns 401 when session is missing or session fetch fails', async () => {
    getSessionMock.mockResolvedValueOnce({ data: { session: null }, error: null });
    const missingSessionRes = await POST(makeRequest({ password: 'Password1!' }));
    expect(missingSessionRes.status).toBe(401);
    await expect(missingSessionRes.json()).resolves.toEqual({
      error: SESSION_ERRORS.RECOVERY_EXPIRED,
    });

    getSessionMock.mockResolvedValueOnce({
      data: { session: null },
      error: { message: 'bad session' },
    });
    const sessionErrorRes = await POST(makeRequest({ password: 'Password1!' }));
    expect(sessionErrorRes.status).toBe(401);
    await expect(sessionErrorRes.json()).resolves.toEqual({
      error: SESSION_ERRORS.RECOVERY_EXPIRED,
    });
  });

  it('returns 401 when updateUser returns a session-related error', async () => {
    updateUserMock.mockResolvedValueOnce({ error: { message: 'jwt expired' } });
    isSessionErrorMock.mockReturnValueOnce(true);

    const res = await POST(makeRequest({ password: 'Password1!' }));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: SESSION_ERRORS.RECOVERY_EXPIRED });
  });

  it('returns 500 when updateUser returns non-session error', async () => {
    updateUserMock.mockResolvedValueOnce({ error: { message: 'db down' } });
    isSessionErrorMock.mockReturnValueOnce(false);

    const res = await POST(makeRequest({ password: 'Password1!' }));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: 'Unable to update password. Please try again.',
    });
  });

  it('returns success, signs out and clears cookies after password update', async () => {
    const res = await POST(makeRequest({ password: 'Password1!' }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: { message: 'Password updated successfully. Please sign in with your new password.' },
    });
    expect(signOutMock).toHaveBeenCalled();
    expect(clearAuthCookiesMock).toHaveBeenCalled();
  });

  it('returns internal error on unexpected exceptions', async () => {
    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));
    const res = await POST(makeRequest({ password: 'Password1!' }));
    expect(res.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });
});
