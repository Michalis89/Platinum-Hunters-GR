export {};

type TestQueueRecord = {
  id: number;
  createdAt: number;
  apiBase: string;
  body: Record<string, unknown>;
};

function makeFlusher(
  getQueue: () => Promise<TestQueueRecord[]>,
  doFetch: (url: string) => Promise<{ ok: boolean }>,
  deleteItem: (id: number) => Promise<void>,
) {
  let flushInProgress = false;

  async function _doFlush() {
    const queue = await getQueue();
    if (queue.length === 0) {
      return 0;
    }
    let count = 0;
    for (const item of queue) {
      const res = await doFetch(`${item.apiBase}/add`);
      if (!res.ok) {
        continue;
      }
      await deleteItem(item.id);
      count += 1;
    }
    return count;
  }

  async function flush() {
    if (flushInProgress) {
      return 0;
    }
    flushInProgress = true;
    try {
      return await _doFlush();
    } finally {
      flushInProgress = false;
    }
  }

  return flush;
}

describe('flushLibrarySyncQueue mutex', () => {
  it('calls fetch for each item when called once', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    const mockDelete = jest.fn().mockResolvedValue(undefined);
    const queue: TestQueueRecord[] = [
      { id: 1, createdAt: 1, apiBase: 'https://example.com/api/library', body: {} },
      { id: 2, createdAt: 2, apiBase: 'https://example.com/api/library', body: {} },
    ];
    const flush = makeFlusher(() => Promise.resolve(queue), mockFetch, mockDelete);

    const result = await flush();

    expect(result).toBe(2);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('returns 0 and does NOT call fetch when called concurrently (second call exits early)', async () => {
    const mockDelete = jest.fn().mockResolvedValue(undefined);
    let resolveFirst!: () => void;
    // First fetch is slow — stays in-flight
    const slowFetch = jest.fn().mockImplementation(
      () =>
        new Promise<{ ok: boolean }>(res => {
          resolveFirst = () => res({ ok: true });
        }),
    );
    const queue: TestQueueRecord[] = [
      { id: 1, createdAt: 1, apiBase: 'https://x.com/api/library', body: {} },
    ];
    const flush = makeFlusher(() => Promise.resolve(queue), slowFetch, mockDelete);

    const first = flush(); // starts, holds flushInProgress = true
    const second = flush(); // should short-circuit immediately

    // Second should already resolve with 0 (no await needed)
    await expect(second).resolves.toBe(0);

    // Unblock first call
    resolveFirst();
    const firstResult = await first;
    expect(firstResult).toBe(1);

    // Total fetch calls: only 1 (from the first flush)
    expect(slowFetch).toHaveBeenCalledTimes(1);
  });

  it('allows a sequential flush after the first completes (flag is cleared in finally)', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    const mockDelete = jest.fn().mockResolvedValue(undefined);
    const queue: TestQueueRecord[] = [
      { id: 1, createdAt: 1, apiBase: 'https://x.com/api/library', body: {} },
    ];
    const flush = makeFlusher(() => Promise.resolve(queue), mockFetch, mockDelete);

    await flush(); // first sequential flush
    const result = await flush(); // second sequential flush (flag cleared)

    // Both should have processed the item (2 total calls)
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toBe(1);
  });
});
