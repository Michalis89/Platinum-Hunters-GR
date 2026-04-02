import { act, renderHook } from '@testing-library/react';
import type { FormEvent } from 'react';
import { useResetPasswordForm } from '../useResetPasswordForm';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
  },
}));

describe('useResetPasswordForm double-submit guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits once when handleSubmit is called twice rapidly', async () => {
    let resolveFetch: ((value: unknown) => void) | null = null;
    const fetchPromise = new Promise(resolve => {
      resolveFetch = resolve;
    });
    global.fetch = jest.fn(() => fetchPromise as Promise<Response>) as unknown as typeof fetch;

    const { result } = renderHook(() => useResetPasswordForm({ allowDevPreview: true }));

    act(() => {
      result.current.setPassword('Password1!');
      result.current.setConfirmPassword('Password1!');
    });

    const event = { preventDefault: jest.fn() } as unknown as FormEvent;

    act(() => {
      void result.current.handleSubmit(event);
      void result.current.handleSubmit(event);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.current.submitting).toBe(true);

    await act(async () => {
      resolveFetch?.({
        ok: true,
        status: 200,
        json: async () => ({ data: {} }),
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.submitting).toBe(false);
  });
});
