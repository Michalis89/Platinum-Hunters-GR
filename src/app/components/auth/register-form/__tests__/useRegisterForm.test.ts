import { act, renderHook } from '@testing-library/react';
import type { FormEvent } from 'react';
import { useRegisterForm } from '../useRegisterForm';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(''),
}));

describe('useRegisterForm double-submit guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits once when handleSubmit is called twice rapidly', async () => {
    let resolveFetch: ((value: unknown) => void) | null = null;
    const fetchPromise = new Promise(resolve => {
      resolveFetch = resolve;
    });
    global.fetch = jest.fn(() => fetchPromise as Promise<Response>) as unknown as typeof fetch;

    const { result } = renderHook(() => useRegisterForm({}));

    act(() => {
      result.current.handleInputChange('email', 'user@example.com');
      result.current.handleInputChange('username', 'user123');
      result.current.handleInputChange('password', 'Password1!');
      result.current.handleInputChange('password_confirm', 'Password1!');
      result.current.handleTermsChange(true);
      result.current.setCaptchaToken('captcha-token');
    });

    const event = { preventDefault: jest.fn() } as unknown as FormEvent<HTMLFormElement>;

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
        json: async () => ({ data: {} }),
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
  });
});
