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

import { GET } from '@/app/api/auth/session/route';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { fail, ok } from '@/lib/api/response';
import { clearAuthCookies } from '@/lib/auth';
import { API_ERRORS } from '@/lib/api/errors';

function createSupabaseMock({
  session,
  sessionError = null,
  profileData = null,
  profileError = null,
}: {
  session: unknown;
  sessionError?: unknown;
  profileData?: unknown;
  profileError?: unknown;
}) {
  const signOut = jest.fn().mockResolvedValue({ error: null });

  return {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session },
        error: sessionError,
      }),
      signOut,
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: profileData,
            error: profileError,
          }),
        })),
      })),
    })),
    __signOut: signOut,
  };
}

describe('app/api/auth/session/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const noStoreHeaders = {
    headers: {
      'Cache-Control': 'no-store',
    },
  };

  it('returns a 500 fail response when getSession reports an error', async () => {
    (createRouteHandlerClient as jest.Mock).mockResolvedValue(
      createSupabaseMock({
        session: null,
        sessionError: { message: 'session failed' },
      }),
    );

    const response = await GET();

    expect(console.error).toHaveBeenCalledWith('Session error:', { message: 'session failed' });
    expect(fail).toHaveBeenCalledWith({ error: 'Session check error' }, 500, noStoreHeaders);
    expect(response.status).toBe(500);
  });

  it('returns null user/session when there is no active session', async () => {
    (createRouteHandlerClient as jest.Mock).mockResolvedValue(
      createSupabaseMock({
        session: null,
      }),
    );

    const response = await GET();

    expect(ok).toHaveBeenCalledWith({ user: null, session: null }, noStoreHeaders);
    expect(response.status).toBe(200);
  });

  it('signs out and clears cookies when the JWT is already expired', async () => {
    const supabase = createSupabaseMock({
      session: {
        expires_at: Math.floor(Date.now() / 1000) - 10,
        user: { id: 'user-1' },
      },
    });
    (createRouteHandlerClient as jest.Mock).mockResolvedValue(supabase);

    const response = await GET();

    expect(supabase.__signOut).toHaveBeenCalled();
    expect(clearAuthCookies).toHaveBeenCalled();
    expect(ok).toHaveBeenCalledWith({ user: null, session: null }, noStoreHeaders);
    expect(response.status).toBe(200);
  });

  it('treats PGRST303 profile failures as an expired session', async () => {
    const session = {
      expires_at: Math.floor(Date.now() / 1000) + 600,
      user: { id: 'user-1' },
    };
    const supabase = createSupabaseMock({
      session,
      profileError: { code: 'PGRST303', message: 'jwt expired' },
    });
    (createRouteHandlerClient as jest.Mock).mockResolvedValue(supabase);

    const response = await GET();

    expect(supabase.__signOut).toHaveBeenCalled();
    expect(clearAuthCookies).toHaveBeenCalled();
    expect(ok).toHaveBeenCalledWith({ user: null, session: null }, noStoreHeaders);
    expect(response.status).toBe(200);
  });

  it('returns 500 when profile loading fails for a non-PGRST303 reason', async () => {
    const session = {
      expires_at: Math.floor(Date.now() / 1000) + 600,
      user: { id: 'user-1' },
    };
    (createRouteHandlerClient as jest.Mock).mockResolvedValue(
      createSupabaseMock({
        session,
        profileError: { code: 'OTHER', message: 'profile failed' },
      }),
    );

    const response = await GET();

    expect(console.error).toHaveBeenCalledWith('Profile fetch error:', {
      code: 'OTHER',
      message: 'profile failed',
    });
    expect(fail).toHaveBeenCalledWith({ error: 'Profile loading error' }, 500, noStoreHeaders);
    expect(response.status).toBe(500);
  });

  it('signs out deleted accounts and returns a null session response', async () => {
    const session = {
      expires_at: Math.floor(Date.now() / 1000) + 600,
      user: { id: 'user-1' },
    };
    const supabase = createSupabaseMock({
      session,
      profileData: {
        id: 'user-1',
        account_status: 'deleted',
      },
    });
    (createRouteHandlerClient as jest.Mock).mockResolvedValue(supabase);

    const response = await GET();

    expect(supabase.__signOut).toHaveBeenCalled();
    expect(clearAuthCookies).toHaveBeenCalled();
    expect(ok).toHaveBeenCalledWith({ user: null, session: null }, noStoreHeaders);
    expect(response.status).toBe(200);
  });

  it('signs out suspended accounts and returns a 403 suspended message', async () => {
    const session = {
      expires_at: Math.floor(Date.now() / 1000) + 600,
      user: { id: 'user-1' },
    };
    const supabase = createSupabaseMock({
      session,
      profileData: {
        id: 'user-1',
        account_status: 'suspended',
      },
    });
    (createRouteHandlerClient as jest.Mock).mockResolvedValue(supabase);

    const response = await GET();

    expect(supabase.__signOut).toHaveBeenCalled();
    expect(clearAuthCookies).toHaveBeenCalled();
    expect(fail).toHaveBeenCalledWith(
      { error: 'Your account has been suspended' },
      403,
      noStoreHeaders,
    );
    expect(response.status).toBe(403);
  });

  it('signs out banned accounts and returns a 403 blocked message', async () => {
    const session = {
      expires_at: Math.floor(Date.now() / 1000) + 600,
      user: { id: 'user-1' },
    };
    const supabase = createSupabaseMock({
      session,
      profileData: {
        id: 'user-1',
        account_status: 'banned',
      },
    });
    (createRouteHandlerClient as jest.Mock).mockResolvedValue(supabase);

    const response = await GET();

    expect(supabase.__signOut).toHaveBeenCalled();
    expect(clearAuthCookies).toHaveBeenCalled();
    expect(fail).toHaveBeenCalledWith(
      { error: 'Your account has been blocked' },
      403,
      noStoreHeaders,
    );
    expect(response.status).toBe(403);
  });

  it('returns the typed user profile and session for active accounts', async () => {
    const session = {
      expires_at: Math.floor(Date.now() / 1000) + 600,
      user: { id: 'user-1' },
      access_token: 'access-1',
    };
    const profile = {
      id: 'user-1',
      username: 'mike',
      account_status: 'active',
    };
    (createRouteHandlerClient as jest.Mock).mockResolvedValue(
      createSupabaseMock({
        session,
        profileData: profile,
      }),
    );

    const response = await GET();

    expect(ok).toHaveBeenCalledWith(
      {
        user: profile,
        session,
      },
      noStoreHeaders,
    );
    expect(response.status).toBe(200);
  });

  it('returns the standardized internal error when an unexpected exception is thrown', async () => {
    (createRouteHandlerClient as jest.Mock).mockRejectedValue(new Error('boom'));

    const response = await GET();

    expect(console.error).toHaveBeenCalledWith('Session error:', expect.any(Error));
    expect(fail).toHaveBeenCalledWith(
      API_ERRORS.INTERNAL,
      API_ERRORS.INTERNAL.status,
      noStoreHeaders,
    );
    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
  });
});
