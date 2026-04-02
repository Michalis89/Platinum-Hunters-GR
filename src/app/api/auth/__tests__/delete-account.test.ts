/**
 * @jest-environment node
 */

const mockSignInWithPassword = jest.fn();
const mockSignOut = jest.fn();
const mockEq = jest.fn();
const mockDelete = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ delete: mockDelete }));
const mockDeleteUser = jest.fn();

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
  requireAuth: jest.fn().mockResolvedValue({
    user: { id: 'user-123', email: 'user@example.com' },
  }),
  UnauthorizedError: class UnauthorizedError extends Error {},
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue({ success: true }),
  rateLimitHeaders: jest.fn().mockReturnValue({}),
}));

jest.mock('@/lib/observability/withApiRoute', () => ({
  withApiRoute: (handler: (...args: unknown[]) => unknown) => handler,
}));

describe('POST /api/auth/delete-account', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
