import { act, renderHook } from '@testing-library/react';
import { useTicketNotificationCount } from '../useTicketNotificationCount';

const mockSubscribe = jest.fn(() => ({}));
const mockOn = jest.fn(function on() {
  return { on: mockOn, subscribe: mockSubscribe };
});
const mockChannel = jest.fn(() => ({ on: mockOn, subscribe: mockSubscribe }));
const mockRemoveChannel = jest.fn().mockResolvedValue(undefined);

jest.mock('@/lib/supabase-client', () => ({
  supabase: {
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

type Stats = {
  inFlight: number;
  maxInFlight: number;
  aborted: number;
  calls: number;
};

function makeSlowAbortableFetch(stats: Stats) {
  return jest.fn().mockImplementation((_url: string, init?: RequestInit) => {
    stats.calls += 1;
    stats.inFlight += 1;
    stats.maxInFlight = Math.max(stats.maxInFlight, stats.inFlight);

    return new Promise<Response>((resolve, reject) => {
      const signal = init?.signal as AbortSignal | undefined;
      let settled = false;

      const onAbort = () => {
        if (settled) {
          return;
        }
        settled = true;
        stats.aborted += 1;
        stats.inFlight -= 1;
        reject(new DOMException('Aborted', 'AbortError'));
      };

      if (signal?.aborted) {
        onAbort();
        return;
      }

      signal?.addEventListener('abort', onAbort);

      setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        signal?.removeEventListener('abort', onAbort);
        stats.inFlight -= 1;
        resolve({
          ok: true,
          json: async () => ({
            data: { unread_count: 5, user_unread_count: 2, admin_unread_count: 3, enabled: true },
          }),
        } as Response);
      }, 60_000);
    });
  });
}

describe('useTicketNotificationCount RC-009', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps only latest interval request in flight by aborting previous ones', async () => {
    const stats: Stats = {
      inFlight: 0,
      maxInFlight: 0,
      aborted: 0,
      calls: 0,
    };
    global.fetch = makeSlowAbortableFetch(stats) as unknown as typeof fetch;

    const { unmount } = renderHook(() => useTicketNotificationCount(true, 1000));

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
    });

    expect(stats.calls).toBe(4);
    expect(stats.maxInFlight).toBe(1);
    expect(stats.aborted).toBeGreaterThanOrEqual(3);

    unmount();
  });
});
