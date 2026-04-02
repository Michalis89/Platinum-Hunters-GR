import { act, renderHook } from '@testing-library/react';
import { useTickets } from '../useTickets';

type PendingRequest = {
  url: string;
  signal: AbortSignal | null;
  aborted: boolean;
  resolve: (payload: unknown) => void;
};

const pendingRequests: PendingRequest[] = [];

function createMockFetch() {
  return jest.fn().mockImplementation((url: string, init?: RequestInit) => {
    return new Promise<Response>((resolve, reject) => {
      const signal = (init?.signal as AbortSignal | undefined) ?? null;
      let settled = false;

      const onAbort = () => {
        if (settled) {
          return;
        }
        settled = true;
        request.aborted = true;
        reject(new DOMException('Aborted', 'AbortError'));
      };

      const request: PendingRequest = {
        url,
        signal,
        aborted: false,
        resolve: payload => {
          if (settled) {
            return;
          }
          settled = true;
          signal?.removeEventListener('abort', onAbort);
          resolve({
            ok: true,
            json: async () => payload,
          } as Response);
        },
      };

      if (signal?.aborted) {
        onAbort();
        return;
      }

      signal?.addEventListener('abort', onAbort);
      pendingRequests.push(request);
    });
  });
}

describe('useTickets RC-009', () => {
  beforeEach(() => {
    pendingRequests.length = 0;
    global.fetch = createMockFetch() as unknown as typeof fetch;
  });

  it('aborts stale request when endpoint changes and keeps only latest state', async () => {
    const { result, rerender } = renderHook(
      ({ endpoint }) =>
        useTickets<{ id: number }>({
          endpoint,
        }),
      { initialProps: { endpoint: '/api/support/tickets?status=open' } },
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(pendingRequests).toHaveLength(1);
    expect(result.current.loading).toBe(true);

    rerender({ endpoint: '/api/support/tickets?status=closed' });

    await act(async () => {
      await Promise.resolve();
    });

    expect(pendingRequests).toHaveLength(2);
    expect(pendingRequests[0]?.aborted).toBe(true);

    await act(async () => {
      pendingRequests[1]?.resolve({
        data: [{ id: 22 }],
        meta: { total: 1, limit: 10, offset: 0 },
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.tickets).toEqual([{ id: 22 }]);
  });
});
