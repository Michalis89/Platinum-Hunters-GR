import { act, renderHook } from '@testing-library/react';
import type { FormEvent } from 'react';
import { useLoginForm } from '../useLoginForm';

const mockPush = jest.fn();
const mockDispatch = jest.fn();
const mockSetSession = jest.fn();
const mockSetAuthPersistence = jest.fn();
const mockFetchSession = jest.fn(() => ({ type: 'fetchSession' }));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(''),
}));

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock('@/store/slices/authSlice', () => ({
  fetchSession: () => mockFetchSession(),
}));

jest.mock('@/lib/supabase-client', () => ({
  setAuthPersistence: (remember: boolean) => mockSetAuthPersistence(remember),
  supabase: {
    auth: {
      setSession: (...args: unknown[]) => mockSetSession(...args),
    },
  },
}));

describe('useLoginForm double-submit guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockResolvedValue({ ok: true });
  });

  it('submits once when handleSubmit is called twice rapidly', async () => {
    let resolveFetch: ((value: unknown) => void) | null = null;
    const fetchPromise = new Promise(resolve => {
      resolveFetch = resolve;
    });
    global.fetch = jest.fn(() => fetchPromise as Promise<Response>) as unknown as typeof fetch;

    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.handleIdentifierChange('user123');
      result.current.handlePasswordChange('Password1!');
      result.current.setCaptchaToken('captcha-token');
    });

    const event = { preventDefault: jest.fn() } as unknown as FormEvent;

    act(() => {
      void result.current.handleSubmit(event);
      void result.current.handleSubmit(event);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveFetch?.({
        ok: true,
        status: 200,
        json: async () => ({ data: { redirectUrl: '/profile/edit' } }),
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
  });
});
