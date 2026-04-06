jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
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
  setAuthCookies: jest.fn(),
}));

import { POST } from '@/app/api/auth/refresh/route';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { fail, ok } from '@/lib/api/response';
import { setAuthCookies } from '@/lib/auth';
import { API_ERRORS } from '@/lib/api/errors';

describe('app/api/auth/refresh/route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.test',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      NODE_ENV: 'test',
    };
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    (cookies as jest.Mock).mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'existing-refresh' }),
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  function makeRequest(body: unknown) {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as Request;
  }

  it('returns 401 when there is no existing refresh token cookie', async () => {
    (cookies as jest.Mock).mockResolvedValue({
      get: jest.fn().mockReturnValue(undefined),
    });

    const response = await POST(makeRequest({}));

    expect(fail).toHaveBeenCalledWith({ error: 'No active session' }, 401);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      body: { error: 'No active session' },
      init: undefined,
    });
  });

  it('returns 400 when the request body is missing required tokens', async () => {
    const response = await POST(makeRequest({ access_token: 'access-only', remember: true }));

    expect(fail).toHaveBeenCalledWith({ error: 'Tokens are missing' }, 400);
    expect(response.status).toBe(400);
  });

  it('returns 500 when required Supabase env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const response = await POST(
      makeRequest({
        access_token: 'access-1',
        refresh_token: 'existing-refresh',
      }),
    );

    expect(console.error).toHaveBeenCalledWith('Missing Supabase environment variables');
    expect(fail).toHaveBeenCalledWith(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
  });

  it('returns 401 when Supabase cannot resolve the access token to a user', async () => {
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'invalid jwt' },
        }),
      },
    });

    const response = await POST(
      makeRequest({
        access_token: 'access-1',
        refresh_token: 'existing-refresh',
      }),
    );

    expect(fail).toHaveBeenCalledWith({ error: 'Invalid access token' }, 401);
    expect(setAuthCookies).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('warns about refresh token rotation outside production and sets remembered auth cookies on success', async () => {
    const getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    (createClient as jest.Mock).mockReturnValue({
      auth: { getUser },
    });

    const response = await POST(
      makeRequest({
        access_token: 'access-1',
        refresh_token: 'rotated-refresh',
        remember: true,
      }),
    );

    expect(console.warn).toHaveBeenCalledWith(
      'Refresh token rotation detected; updating cookies with the latest token.',
    );
    expect(createClient).toHaveBeenCalledWith('https://supabase.test', 'anon-key', {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: 'Bearer access-1' } },
    });
    expect(getUser).toHaveBeenCalledWith('access-1');
    expect(setAuthCookies).toHaveBeenCalledWith('access-1', 'rotated-refresh', true);
    expect(ok).toHaveBeenCalledWith({ success: true });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { success: true },
      init: undefined,
    });
  });

  it('does not warn in production when the refresh token changes', async () => {
    process.env.NODE_ENV = 'production';
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    });

    await POST(
      makeRequest({
        access_token: 'access-1',
        refresh_token: 'rotated-refresh',
        remember: false,
      }),
    );

    expect(console.warn).not.toHaveBeenCalled();
    expect(setAuthCookies).toHaveBeenCalledWith('access-1', 'rotated-refresh', false);
  });

  it('returns the standardized internal error when an unexpected exception is thrown', async () => {
    const request = {
      json: jest.fn().mockRejectedValue(new Error('bad json')),
    } as unknown as Request;

    const response = await POST(request);

    expect(console.error).toHaveBeenCalledWith('Token refresh error:', expect.any(Error));
    expect(fail).toHaveBeenCalledWith(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
  });
});
