/**
 * @jest-environment jsdom
 */

const mockFetch = jest.fn();
const mockIsAuthPersistenceEnabled = jest.fn(() => true);

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: () => null,
}));

jest.mock('@/store/slices/authSlice', () => ({
  fetchSession: jest.fn(),
  setUser: jest.fn(),
  logout: jest.fn(),
  selectUser: jest.fn(),
}));

jest.mock('@/store/store', () => ({}));

jest.mock('@/lib/supabase-client', () => ({
  isAuthPersistenceEnabled: () => mockIsAuthPersistenceEnabled(),
  supabase: {
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      setSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

jest.mock('@/lib/routes/authRoutes', () => ({
  getLoginUrl: jest.fn(),
  shouldRedirectToLogin: jest.fn(() => false),
}));

describe('AuthInit syncCookies inflight dedupe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('coalesces concurrent calls and clears inflight for sequential calls', async () => {
    const delayedOkResponse = new Promise<{ ok: boolean; status: number }>(resolve => {
      setTimeout(() => resolve({ ok: true, status: 200 }), 10);
    });
    mockFetch.mockReturnValue(delayedOkResponse);

    const { syncCookies } = await import('@/app/components/AuthInit');
    const session = { access_token: 'token-a', refresh_token: 'refresh-a', expires_in: 3600 };

    const first = syncCookies(session);
    const second = syncCookies({
      access_token: 'token-b',
      refresh_token: 'refresh-b',
      expires_in: 3600,
    });

    const [resultA, resultB] = await Promise.all([first, second]);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(resultA).toBe(true);
    expect(resultB).toBe(resultA);

    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
    const third = await syncCookies(session);

    expect(third).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
