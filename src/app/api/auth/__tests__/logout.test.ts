jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: jest.fn(),
}));

jest.mock('@/lib/api/response', () => ({
  __esModule: true,
  ok: jest.fn((data: unknown, init?: ResponseInit) => ({
    status: 200,
    json: async () => ({ data, init }),
  })),
  fail: jest.fn((body: unknown, status: number, init?: ResponseInit) => ({
    status,
    json: async () => ({ body, init }),
  })),
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  clearAuthCookies: jest.fn(),
}));

import { POST } from '@/app/api/auth/logout/route';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { fail, ok } from '@/lib/api/response';
import { clearAuthCookies } from '@/lib/auth';
import { API_ERRORS } from '@/lib/api/errors';

describe('app/api/auth/logout/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('signs out, clears cookies, and returns a no-store success response', async () => {
    const signOut = jest.fn().mockResolvedValue({ error: null });
    (createRouteHandlerClient as jest.Mock).mockResolvedValue({
      auth: { signOut },
    });

    const response = await POST();

    expect(signOut).toHaveBeenCalled();
    expect(clearAuthCookies).toHaveBeenCalled();
    expect(ok).toHaveBeenCalledWith(
      { message: 'Logout successful' },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { message: 'Logout successful' },
      init: {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    });
  });

  it('returns a 500 fail response when Supabase signOut reports an error', async () => {
    const signOutError = { message: 'signout failed' };
    (createRouteHandlerClient as jest.Mock).mockResolvedValue({
      auth: {
        signOut: jest.fn().mockResolvedValue({ error: signOutError }),
      },
    });

    const response = await POST();

    expect(console.error).toHaveBeenCalledWith('Logout error:', signOutError);
    expect(clearAuthCookies).not.toHaveBeenCalled();
    expect(fail).toHaveBeenCalledWith({ error: 'Logout error' }, 500, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      body: { error: 'Logout error' },
      init: {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    });
  });

  it('returns the standardized internal error when logout throws unexpectedly', async () => {
    (createRouteHandlerClient as jest.Mock).mockRejectedValue(new Error('boom'));

    const response = await POST();

    expect(console.error).toHaveBeenCalledWith('Logout error:', expect.any(Error));
    expect(fail).toHaveBeenCalledWith(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(response.json()).resolves.toEqual({
      body: API_ERRORS.INTERNAL,
      init: {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    });
  });
});
