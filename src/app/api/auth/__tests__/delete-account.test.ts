/**
 * @jest-environment node
 */

const mockSignInWithPassword = jest.fn();
const mockSignOut = jest.fn();
const mockEq = jest.fn();
const mockDelete = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ delete: mockDelete }));
const mockDeleteUser = jest.fn();
const mockRequireAuth = jest.fn();
const mockRateLimit = jest.fn();
const mockRateLimitHeaders = jest.fn();

const mockSupabase = {
  auth: {
    signInWithPassword: mockSignInWithPassword,
    signOut: mockSignOut,
  },
  from: mockFrom,
};

jest.mock('@/lib/supabase-route-handler', () => ({
  createRouteHandlerClient: jest.fn().mockResolvedValue(mockSupabase),
}));

jest.mock('@/lib/supabase-server', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    auth: {
      admin: {
        deleteUser: mockDeleteUser,
      },
    },
  })),
}));

jest.mock('@/lib/api/auth', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  UnauthorizedError: class UnauthorizedError extends Error {},
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  rateLimitHeaders: (...args: unknown[]) => mockRateLimitHeaders(...args),
}));

jest.mock('@/lib/observability/withApiRoute', () => ({
  withApiRoute: (handler: (...args: unknown[]) => unknown) => handler,
}));

describe('POST /api/auth/delete-account', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com' },
    });
    mockRateLimit.mockResolvedValue({ success: true });
    mockRateLimitHeaders.mockReturnValue({});
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockDeleteUser.mockResolvedValue({ error: null });
    mockEq.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValue(undefined);
  });

  function makeRequest() {
    return new Request('http://localhost/api/auth/delete-account', {
      method: 'POST',
      body: JSON.stringify({ password: 'secret' }),
    });
  }

  it('returns 500 and never deletes profile row when auth deletion fails', async () => {
    mockDeleteUser.mockResolvedValueOnce({ error: new Error('auth delete failed') });
    const fromSpy = jest.spyOn(mockSupabase, 'from');
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const { POST } = await import('@/app/api/auth/delete-account/route');
    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
    expect(mockDeleteUser).toHaveBeenCalledWith('user-123');
    expect(fromSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('Auth deletion error:', expect.any(Error));

    errorSpy.mockRestore();
  });

  it('returns 500 and never deletes profile row when auth deletion throws', async () => {
    mockDeleteUser.mockRejectedValueOnce(new Error('auth delete threw'));
    const fromSpy = jest.spyOn(mockSupabase, 'from');
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const { POST } = await import('@/app/api/auth/delete-account/route');
    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
    expect(mockDeleteUser).toHaveBeenCalledWith('user-123');
    expect(fromSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('Delete account error:', expect.any(Error));

    errorSpy.mockRestore();
  });

  it('returns success and logs when profile deletion fails after auth delete', async () => {
    mockEq.mockResolvedValueOnce({ error: new Error('profile delete failed') });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const { POST } = await import('@/app/api/auth/delete-account/route');
    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockDeleteUser).toHaveBeenCalledWith('user-123');
    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
    expect(body).toEqual({ data: { message: 'Account deleted successfully' } });
    expect(errorSpy).toHaveBeenCalledWith(
      'User profile deletion error (auth already deleted):',
      expect.any(Error),
    );

    errorSpy.mockRestore();
  });

  it('returns 429 when rate limit blocks request', async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false, limit: 1, remaining: 0, reset: 123 });
    mockRateLimitHeaders.mockReturnValueOnce({ 'X-RateLimit-Remaining': '0' });
    const { POST } = await import('@/app/api/auth/delete-account/route');

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body).toEqual({ error: 'Too many attempts. Please try again later.' });
    expect(mockRateLimitHeaders).toHaveBeenCalled();
  });

  it('returns 400 when password is missing or invalid', async () => {
    const { POST } = await import('@/app/api/auth/delete-account/route');

    const noPasswordRes = await POST(
      new Request('http://localhost/api/auth/delete-account', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );
    expect(noPasswordRes.status).toBe(400);

    const invalidPasswordRes = await POST(
      new Request('http://localhost/api/auth/delete-account', {
        method: 'POST',
        body: JSON.stringify({ password: 123 }),
      }),
    );
    expect(invalidPasswordRes.status).toBe(400);
  });

  it('returns 400 when request body is invalid json', async () => {
    const { POST } = await import('@/app/api/auth/delete-account/route');
    const res = await POST(
      new Request('http://localhost/api/auth/delete-account', {
        method: 'POST',
        body: '{',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when authenticated user has no email', async () => {
    mockRequireAuth.mockResolvedValueOnce({ user: { id: 'user-123', email: undefined } });
    const { POST } = await import('@/app/api/auth/delete-account/route');
    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
  });

  it('returns 401 when password verification fails', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: { message: 'bad creds' } });
    const { POST } = await import('@/app/api/auth/delete-account/route');
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it('still returns 200 when signOut throws warning', async () => {
    mockSignOut.mockRejectedValueOnce(new Error('sign out failed'));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { POST } = await import('@/app/api/auth/delete-account/route');

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(warnSpy).toHaveBeenCalledWith('SignOut warning (continuing anyway):', expect.any(Error));

    warnSpy.mockRestore();
  });

  it('returns unauthorized response when requireAuth throws UnauthorizedError', async () => {
    const { UnauthorizedError } = await import('@/lib/api/auth');
    mockRequireAuth.mockRejectedValueOnce(new UnauthorizedError());
    const { POST } = await import('@/app/api/auth/delete-account/route');

    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns internal error response for unexpected failures', async () => {
    mockRateLimit.mockRejectedValueOnce(new Error('boom'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { POST } = await import('@/app/api/auth/delete-account/route');

    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
    expect(errorSpy).toHaveBeenCalledWith('Delete account error:', expect.any(Error));

    errorSpy.mockRestore();
  });
});
