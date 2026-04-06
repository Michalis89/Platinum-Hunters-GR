type QueueRecord = {
  id?: number;
  createdAt: number;
  apiBase: string;
  body: Record<string, unknown>;
};

class FakeExtendableEvent {
  public waits: Promise<unknown>[] = [];
  waitUntil(promise: Promise<unknown> | unknown) {
    this.waits.push(Promise.resolve(promise));
  }
  async done() {
    await Promise.all(this.waits);
  }
}

type MutableWorkerEvent = FakeExtendableEvent & {
  data?: unknown;
  tag?: string;
  notification?: {
    close?: () => void;
    data?: {
      url?: string;
      notificationId?: string;
    };
  };
};

type Listener = (event: MutableWorkerEvent) => void;

type MockIdbRequest<T = unknown> = {
  onupgradeneeded?: (() => void) | null;
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
  error: Error | null;
  result: T | null;
};

type MockIdbDeleteRequest = {
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
  error: Error | null;
};

type MockIdbTransaction = {
  error: Error | null;
  onerror: (() => void) | null;
  onabort: (() => void) | null;
  objectStore: () => {
    getAll: () => MockIdbRequest<unknown>;
    delete: (id: number) => MockIdbDeleteRequest;
  };
  mode?: 'readonly';
};

function createIndexedDbMock(
  queue: QueueRecord[],
  options?: {
    openError?: boolean;
    getAllResult?: unknown;
    getAllError?: 'request' | 'txerror' | 'txabort';
    deleteError?: 'request' | 'txerror' | 'txabort';
    nullErrorValues?: boolean;
  },
) {
  let storeCreated = false;

  return {
    open: jest.fn(() => {
      const request: MockIdbRequest = {
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        error: null,
        result: null,
      };

      const db = {
        objectStoreNames: {
          contains: () => storeCreated,
        },
        createObjectStore: jest.fn(() => {
          storeCreated = true;
        }),
        transaction: (_name: string, mode: 'readonly' | 'readwrite') => {
          const tx: MockIdbTransaction = {
            error: null,
            onerror: null,
            onabort: null,
            objectStore: () => ({
              getAll: () => {
                const req: MockIdbRequest = {
                  onsuccess: null,
                  onerror: null,
                  error: null,
                  result: null,
                };
                queueMicrotask(() => {
                  if (options?.getAllError === 'request') {
                    req.error = options.nullErrorValues ? null : new Error('getAll request error');
                    req.onerror?.();
                    return;
                  }
                  if (options?.getAllError === 'txerror') {
                    tx.error = options.nullErrorValues ? null : new Error('getAll tx error');
                    tx.onerror?.();
                    return;
                  }
                  if (options?.getAllError === 'txabort') {
                    tx.error = options.nullErrorValues ? null : new Error('getAll tx abort');
                    tx.onabort?.();
                    return;
                  }
                  req.result = options?.getAllResult ?? [...queue];
                  req.onsuccess?.();
                });
                return req;
              },
              delete: (id: number) => {
                const req: MockIdbDeleteRequest = { onsuccess: null, onerror: null, error: null };
                queueMicrotask(() => {
                  if (options?.deleteError === 'request') {
                    req.error = options.nullErrorValues ? null : new Error('delete request error');
                    req.onerror?.();
                    return;
                  }
                  if (options?.deleteError === 'txerror') {
                    tx.error = options.nullErrorValues ? null : new Error('delete tx error');
                    tx.onerror?.();
                    return;
                  }
                  if (options?.deleteError === 'txabort') {
                    tx.error = options.nullErrorValues ? null : new Error('delete tx abort');
                    tx.onabort?.();
                    return;
                  }
                  const idx = queue.findIndex(q => q.id === id);
                  if (idx >= 0) {
                    queue.splice(idx, 1);
                  }
                  req.onsuccess?.();
                });
                return req;
              },
            }),
          };
          if (mode === 'readonly') {
            tx.mode = 'readonly';
          }
          return tx;
        },
        close: jest.fn(),
      };

      request.result = db;
      queueMicrotask(() => {
        if (options?.openError) {
          request.error = options.nullErrorValues ? null : new Error('open error');
          request.onerror?.();
          return;
        }
        request.onupgradeneeded?.();
        request.onsuccess?.();
      });

      return request;
    }),
  };
}

function setupWorkerEnv(
  queue: QueueRecord[],
  idbOptions?: {
    openError?: boolean;
    getAllResult?: unknown;
    getAllError?: 'request' | 'txerror' | 'txabort';
    deleteError?: 'request' | 'txerror' | 'txabort';
    nullErrorValues?: boolean;
  },
) {
  const listeners: Record<string, Listener[]> = {};
  const showNotification = jest.fn(async () => undefined);
  const matchAll = jest.fn(async () => []);
  const openWindow = jest.fn(async () => undefined);
  const cacheKeys = jest.fn(async () => ['auth-pages', 'other-cache', 'supabase-rest']);
  const cacheDelete = jest.fn(async () => true);

  const swGlobals = {
    addEventListener: jest.fn((type: string, handler: Listener) => {
      listeners[type] ??= [];
      listeners[type].push(handler);
    }),
    registration: {
      showNotification,
    },
    clients: {
      matchAll,
      openWindow,
    },
  };

  const globalScope = globalThis as typeof globalThis & {
    addEventListener: (type: string, handler: Listener) => void;
    registration: { showNotification: typeof showNotification };
    clients: { matchAll: typeof matchAll; openWindow: typeof openWindow };
    caches: { keys: typeof cacheKeys; delete: typeof cacheDelete };
    indexedDB: ReturnType<typeof createIndexedDbMock>;
  };

  Object.assign(globalScope, swGlobals);
  globalScope.caches = {
    keys: cacheKeys,
    delete: cacheDelete,
  };
  globalScope.indexedDB = createIndexedDbMock(queue, idbOptions);

  return {
    listeners,
    showNotification,
    matchAll,
    openWindow,
    cacheKeys,
    cacheDelete,
  };
}

describe('worker/index', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('handles message events for cache clearing and queue flushing, including mutex', async () => {
    const queue: QueueRecord[] = [{ id: 1, createdAt: 1, apiBase: '/api/anime', body: { a: 1 } }];
    const env = setupWorkerEnv(queue);

    let resolveAdd!: () => void;
    const firstAdd = new Promise(resolve => {
      resolveAdd = () => resolve({ ok: true });
    });
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/add')) {
        return firstAdd as Promise<Response>;
      }
      return Promise.resolve({ ok: true } as Response);
    }) as jest.Mock;

    await import('@/worker/index');

    const clearEvent = new FakeExtendableEvent() as MutableWorkerEvent;
    clearEvent.data = { type: 'CLEAR_AUTH_CACHE' };
    env.listeners.message[0](clearEvent);
    await clearEvent.done();
    expect(env.cacheKeys).toHaveBeenCalledTimes(1);
    expect(env.cacheDelete).toHaveBeenCalledWith('auth-pages');
    expect(env.cacheDelete).toHaveBeenCalledWith('supabase-rest');
    expect(env.cacheDelete).not.toHaveBeenCalledWith('other-cache');

    const flush1 = new FakeExtendableEvent() as MutableWorkerEvent;
    flush1.data = { type: 'FLUSH_LIBRARY_SYNC_QUEUE' };
    env.listeners.message[0](flush1);

    const flush2 = new FakeExtendableEvent() as MutableWorkerEvent;
    flush2.data = { type: 'FLUSH_LIBRARY_SYNC_QUEUE' };
    env.listeners.message[0](flush2);
    await flush2.done();

    resolveAdd();
    await flush1.done();

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/anime/add',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(queue.some(q => q.id === 1)).toBe(false);

    const unknownMessage = new FakeExtendableEvent() as MutableWorkerEvent;
    unknownMessage.data = { type: 'UNKNOWN' };
    env.listeners.message[0](unknownMessage);
    expect(unknownMessage.waits).toHaveLength(0);
  });

  it('flushes queue edge cases (empty, missing id, non-ok response, fetch throw)', async () => {
    const queue: QueueRecord[] = [
      { createdAt: 1, apiBase: '/api/anime', body: { missing: true } },
      { id: 2, createdAt: 2, apiBase: '/api/anime', body: { bad: true } },
      { id: 3, createdAt: 3, apiBase: '/api/anime', body: { throw: true } },
      { id: 4, createdAt: 4, apiBase: '/api/anime', body: { good: true } },
    ];
    const env = setupWorkerEnv(queue);

    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (!url.endsWith('/add')) {
        return { ok: true } as Response;
      }
      const call = (global.fetch as jest.Mock).mock.calls.length;
      if (call === 1) {
        return { ok: false } as Response;
      }
      if (call === 2) {
        throw new Error('network');
      }
      return { ok: true } as Response;
    }) as jest.Mock;

    await import('@/worker/index');

    const syncRight = new FakeExtendableEvent() as MutableWorkerEvent;
    syncRight.tag = 'library-add-sync';
    env.listeners.sync[0](syncRight);
    await syncRight.done();
    expect(queue.some(q => q.id === 4)).toBe(false);

    queue.splice(0, queue.length);
    const syncEmpty = new FakeExtendableEvent() as MutableWorkerEvent;
    syncEmpty.tag = 'library-add-sync';
    env.listeners.sync[0](syncEmpty);
    await syncEmpty.done();
  });

  it('handles push event payload parsing variants and received tracking', async () => {
    const queue: QueueRecord[] = [];
    const env = setupWorkerEnv(queue);

    global.fetch = jest.fn(async () => ({ ok: true }) as Response);
    await import('@/worker/index');

    const pushNoData = new FakeExtendableEvent() as MutableWorkerEvent;
    pushNoData.data = null;
    env.listeners.push[0](pushNoData);
    await pushNoData.done();
    expect(env.showNotification).toHaveBeenCalledWith(
      'Hobbistas',
      expect.objectContaining({
        body: 'Open the app to see your latest updates.',
      }),
    );

    const pushJson = new FakeExtendableEvent() as MutableWorkerEvent;
    pushJson.data = {
      json: () => ({
        notificationId: 'n1',
        title: 'Title',
        body: 'Body',
        url: '/news',
        icon: '/icon.png',
        badge: '/badge.png',
      }),
      text: () => 'fallback',
    };
    env.listeners.push[0](pushJson);
    await pushJson.done();
    expect(env.showNotification).toHaveBeenCalledWith(
      'Title',
      expect.objectContaining({
        body: 'Body',
        icon: '/icon.png',
        badge: '/badge.png',
        tag: 'notification-n1',
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/notifications/events',
      expect.objectContaining({ method: 'POST' }),
    );

    const pushJsonNull = new FakeExtendableEvent() as MutableWorkerEvent;
    pushJsonNull.data = {
      json: () => null,
      text: () => 'unused',
    };
    env.listeners.push[0](pushJsonNull);
    await pushJsonNull.done();
    expect(env.showNotification).toHaveBeenCalledWith(
      'Hobbistas',
      expect.objectContaining({
        body: 'Open the app to see your latest updates.',
      }),
    );

    const pushTrackDefaultRoute = new FakeExtendableEvent() as MutableWorkerEvent;
    pushTrackDefaultRoute.data = {
      json: () => ({ notificationId: 'n-default-route' }),
      text: () => 'unused',
    };
    env.listeners.push[0](pushTrackDefaultRoute);
    await pushTrackDefaultRoute.done();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/notifications/events',
      expect.objectContaining({
        body: expect.stringContaining('"route":"/home"'),
      }),
    );

    const pushFallback = new FakeExtendableEvent() as MutableWorkerEvent;
    pushFallback.data = {
      json: () => {
        throw new Error('invalid json');
      },
      text: () => 'plain text body',
    };
    env.listeners.push[0](pushFallback);
    await pushFallback.done();
    expect(env.showNotification).toHaveBeenCalledWith(
      'Hobbistas',
      expect.objectContaining({ body: 'plain text body' }),
    );
  });

  it('handles notification click/close and sync/periodicsync events', async () => {
    const queue: QueueRecord[] = [{ id: 10, createdAt: 1, apiBase: '/api/books', body: { k: 1 } }];
    const env = setupWorkerEnv(queue);

    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/notifications/events')) {
        throw new Error('analytics down');
      }
      return { ok: true } as Response;
    }) as jest.Mock;
    await import('@/worker/index');

    const closeFn = jest.fn();
    const notificationClick = new FakeExtendableEvent() as MutableWorkerEvent;
    notificationClick.notification = {
      close: closeFn,
      data: { url: '/target', notificationId: 'n9' },
    };
    const focusedClient = {
      url: `${globalThis.location.origin}/page`,
      focus: jest.fn(async () => undefined),
      navigate: jest.fn(async () => undefined),
    };
    env.matchAll.mockResolvedValueOnce([focusedClient]);
    env.listeners.notificationclick[0](notificationClick);
    await notificationClick.done();
    expect(closeFn).toHaveBeenCalledTimes(1);
    expect(focusedClient.focus).toHaveBeenCalledTimes(1);
    expect(focusedClient.navigate).toHaveBeenCalledWith('/target');

    const notificationClickOpenWindow = new FakeExtendableEvent() as MutableWorkerEvent;
    notificationClickOpenWindow.notification = {
      close: jest.fn(),
      data: { url: '/new-window', notificationId: 'n10' },
    };
    env.matchAll.mockResolvedValueOnce([{ url: 'https://other.local/a', focus: jest.fn() }]);
    env.listeners.notificationclick[0](notificationClickOpenWindow);
    await notificationClickOpenWindow.done();
    expect(env.openWindow).toHaveBeenCalledWith('/new-window');

    const notificationClickDefaultData = new FakeExtendableEvent() as MutableWorkerEvent;
    notificationClickDefaultData.notification = {
      close: jest.fn(),
      data: undefined,
    };
    env.matchAll.mockResolvedValueOnce([]);
    env.listeners.notificationclick[0](notificationClickDefaultData);
    await notificationClickDefaultData.done();
    expect(env.openWindow).toHaveBeenCalledWith('/home');

    const notificationClose = new FakeExtendableEvent() as MutableWorkerEvent;
    notificationClose.notification = { data: { notificationId: 'n11', url: '/x' } };
    env.listeners.notificationclose[0](notificationClose);
    await notificationClose.done();

    const notificationCloseDefault = new FakeExtendableEvent() as MutableWorkerEvent;
    notificationCloseDefault.notification = {};
    env.listeners.notificationclose[0](notificationCloseDefault);
    await notificationCloseDefault.done();

    const syncWrong = new FakeExtendableEvent() as MutableWorkerEvent;
    syncWrong.tag = 'other-tag';
    env.listeners.sync[0](syncWrong);
    expect(syncWrong.waits).toHaveLength(0);

    const syncRight = new FakeExtendableEvent() as MutableWorkerEvent;
    syncRight.tag = 'library-add-sync';
    env.listeners.sync[0](syncRight);
    await syncRight.done();

    const periodicWrong = new FakeExtendableEvent() as MutableWorkerEvent;
    periodicWrong.tag = 'other-periodic';
    env.listeners.periodicsync[0](periodicWrong);
    expect(periodicWrong.waits).toHaveLength(0);

    const periodicRight = new FakeExtendableEvent() as MutableWorkerEvent;
    periodicRight.tag = 'feed-refresh';
    env.listeners.periodicsync[0](periodicRight);
    await periodicRight.done();
    expect(global.fetch).toHaveBeenCalledWith('/api/user/continue', {
      credentials: 'include',
      cache: 'no-store',
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/activity?scope=me&limit=20', {
      credentials: 'include',
      cache: 'no-store',
    });

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('periodic fail'));
    const periodicCatch = new FakeExtendableEvent() as MutableWorkerEvent;
    periodicCatch.tag = 'feed-refresh';
    env.listeners.periodicsync[0](periodicCatch);
    await periodicCatch.done();
  });

  it('covers indexedDB error paths for open/getAll/delete callbacks', async () => {
    const queue: QueueRecord[] = [{ id: 1, createdAt: 1, apiBase: '/api/x', body: { a: 1 } }];

    const openErrEnv = setupWorkerEnv(queue, { openError: true });
    global.fetch = jest.fn(async () => ({ ok: true }) as Response);
    await import('@/worker/index');
    const openErrSync = new FakeExtendableEvent() as MutableWorkerEvent;
    openErrSync.tag = 'library-add-sync';
    openErrEnv.listeners.sync[0](openErrSync);
    await expect(openErrSync.done()).rejects.toThrow('open error');

    jest.resetModules();
    const getAllRequestEnv = setupWorkerEnv(queue, { getAllError: 'request' });
    await import('@/worker/index');
    const getAllRequestSync = new FakeExtendableEvent() as MutableWorkerEvent;
    getAllRequestSync.tag = 'library-add-sync';
    getAllRequestEnv.listeners.sync[0](getAllRequestSync);
    await expect(getAllRequestSync.done()).rejects.toThrow('getAll request error');

    jest.resetModules();
    const getAllTxErrEnv = setupWorkerEnv(queue, { getAllError: 'txerror' });
    await import('@/worker/index');
    const getAllTxErrSync = new FakeExtendableEvent() as MutableWorkerEvent;
    getAllTxErrSync.tag = 'library-add-sync';
    getAllTxErrEnv.listeners.sync[0](getAllTxErrSync);
    await expect(getAllTxErrSync.done()).rejects.toThrow('getAll tx error');

    jest.resetModules();
    const getAllTxAbortEnv = setupWorkerEnv(queue, { getAllError: 'txabort' });
    await import('@/worker/index');
    const getAllTxAbortSync = new FakeExtendableEvent() as MutableWorkerEvent;
    getAllTxAbortSync.tag = 'library-add-sync';
    getAllTxAbortEnv.listeners.sync[0](getAllTxAbortSync);
    await expect(getAllTxAbortSync.done()).rejects.toThrow('getAll tx abort');

    jest.resetModules();
    const nonArrayEnv = setupWorkerEnv(queue, { getAllResult: { not: 'array' } });
    await import('@/worker/index');
    const nonArraySync = new FakeExtendableEvent() as MutableWorkerEvent;
    nonArraySync.tag = 'library-add-sync';
    nonArrayEnv.listeners.sync[0](nonArraySync);
    await nonArraySync.done();

    const deletionModes: Array<'request' | 'txerror' | 'txabort'> = [
      'request',
      'txerror',
      'txabort',
    ];
    for (const mode of deletionModes) {
      jest.resetModules();
      const deleteErrEnv = setupWorkerEnv(
        [{ id: 5, createdAt: 1, apiBase: '/api/y', body: { m: mode } }],
        { deleteError: mode },
      );
      global.fetch = jest.fn(async () => ({ ok: true }) as Response);
      await import('@/worker/index');
      const deleteErrSync = new FakeExtendableEvent() as MutableWorkerEvent;
      deleteErrSync.tag = 'library-add-sync';
      deleteErrEnv.listeners.sync[0](deleteErrSync);
      await deleteErrSync.done();
    }
  });

  it('covers fallback error messages when indexedDB errors are nullish', async () => {
    global.fetch = jest.fn(async () => ({ ok: true }) as Response);

    jest.resetModules();
    const openNullErrEnv = setupWorkerEnv([], { openError: true, nullErrorValues: true });
    await import('@/worker/index');
    const openNullErrSync = new FakeExtendableEvent() as MutableWorkerEvent;
    openNullErrSync.tag = 'library-add-sync';
    openNullErrEnv.listeners.sync[0](openNullErrSync);
    await expect(openNullErrSync.done()).rejects.toThrow('Failed to open queue database');

    const readonlyModes: Array<'request' | 'txerror' | 'txabort'> = [
      'request',
      'txerror',
      'txabort',
    ];
    for (const mode of readonlyModes) {
      jest.resetModules();
      const env = setupWorkerEnv([{ id: 1, createdAt: 1, apiBase: '/api/z', body: {} }], {
        getAllError: mode,
        nullErrorValues: true,
      });
      await import('@/worker/index');
      const event = new FakeExtendableEvent() as MutableWorkerEvent;
      event.tag = 'library-add-sync';
      env.listeners.sync[0](event);
      const expected =
        mode === 'request'
          ? 'Failed to read queue'
          : mode === 'txerror'
            ? 'Queue transaction failed'
            : 'Queue transaction aborted';
      await expect(event.done()).rejects.toThrow(expected);
    }

    const deleteModes: Array<'request' | 'txerror' | 'txabort'> = ['request', 'txerror', 'txabort'];
    for (const mode of deleteModes) {
      jest.resetModules();
      const env = setupWorkerEnv([{ id: 9, createdAt: 1, apiBase: '/api/z', body: {} }], {
        deleteError: mode,
        nullErrorValues: true,
      });
      global.fetch = jest.fn(async () => ({ ok: true }) as Response);
      await import('@/worker/index');
      const event = new FakeExtendableEvent() as MutableWorkerEvent;
      event.tag = 'library-add-sync';
      env.listeners.sync[0](event);
      await event.done();
    }
  });
});
