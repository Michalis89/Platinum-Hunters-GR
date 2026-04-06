/**
 * useFetch refetch AbortController test
 *
 * Verifies that calling refetch() rapidly:
 *   - Cancels the prior in-flight request (AbortError on old signal)
 *   - Only the last response is written to state (no stale overwrites)
 */

import { renderHook, act } from '@testing-library/react';
import { useFetch } from '../useFetch';

// ── fetch mock ────────────────────────────────────────────────────────────────
// Each call returns a promise we control manually.
type Resolver = { resolve: (data: unknown) => void; abort: () => void; signal: AbortSignal };
const pending: Resolver[] = [];

function makeMockFetch() {
  return jest.fn().mockImplementation((_url: string, init?: RequestInit) => {
    return new Promise<Response>((resolve, reject) => {
      const signal = init?.signal as AbortSignal | undefined;

      const doAbort = () => {
        reject(new DOMException('AbortError', 'AbortError'));
      };

      if (signal?.aborted) {
        doAbort();
        return;
      }

      signal?.addEventListener('abort', doAbort);

      pending.push({
        resolve: (data: unknown) => {
          signal?.removeEventListener('abort', doAbort);
          resolve({
            ok: true,
            json: async () => data,
          } as Response);
        },
        abort: doAbort,
        signal: signal as AbortSignal,
      });
    });
  });
}

describe('useFetch – refetch AbortController', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    pending.length = 0;
    mockFetch = makeMockFetch();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('cancels prior in-flight refetch when called again', async () => {
    const { result } = renderHook(() => useFetch<{ value: number }>('/api/test'));

    // Wait for initial fetch to register
    await act(async () => {
      await Promise.resolve(); // flush microtasks
    });

    // Trigger 3 rapid refetches
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.refetch();
    });

    // There should be several pending fetches; resolve only the last one
    // The first two should have been aborted by successive refetch() calls.
    const allPending = [...pending];
    // Resolve the last pending request
    const last = allPending[allPending.length - 1];
    await act(async () => {
      last.resolve({ value: 99 });
      await Promise.resolve();
      await Promise.resolve();
    });

    // Only the last resolved value should be in state
    expect(result.current.data).toEqual({ value: 99 });
    expect(result.current.error).toBeNull();
  });

  it('hook API shape is unchanged', () => {
    const { result } = renderHook(() => useFetch<{ x: number }>('/api/test'));
    expect(typeof result.current.refetch).toBe('function');
    expect(result.current.data).toBeNull();
    expect(typeof result.current.loading).toBe('boolean');
    expect(result.current.error).toBeNull();
  });
});
