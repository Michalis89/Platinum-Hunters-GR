/// <reference lib="webworker" />

const sw = globalThis as unknown as ServiceWorkerGlobalScope;

const AUTH_CACHE_NAMES = new Set(['auth-pages', 'supabase-rest']);
const LIBRARY_SYNC_TAG = 'library-add-sync';
const FEED_REFRESH_SYNC_TAG = 'feed-refresh';
const QUEUE_DB_NAME = 'hobbistas-pwa';
const QUEUE_DB_VERSION = 1;
const QUEUE_STORE_NAME = 'library-add-queue';

type QueueRecord = {
  id?: number;
  createdAt: number;
  apiBase: string;
  body: Record<string, unknown>;
};

type PushPayload = {
  notificationId?: string;
  title?: string;
  body?: string;
  url?: string;
  icon?: string;
  badge?: string;
};

type NotificationEventLike = ExtendableEvent & {
  notification: Notification & { data?: { url?: string } };
};

type SyncEventLike = ExtendableEvent & {
  tag?: string;
};

type PeriodicSyncEventLike = ExtendableEvent & {
  tag?: string;
};

async function clearAuthCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => {
      if (!AUTH_CACHE_NAMES.has(cacheName)) {
        return Promise.resolve(false);
      }
      return caches.delete(cacheName);
    }),
  );
}

function openQueueDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(QUEUE_DB_NAME, QUEUE_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE_NAME)) {
        db.createObjectStore(QUEUE_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open queue database'));
  });
}

async function getQueuedLibraryAdds(): Promise<QueueRecord[]> {
  const db = await openQueueDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE_NAME, 'readonly');
      const store = tx.objectStore(QUEUE_STORE_NAME);
      const request = store.getAll() as IDBRequest<QueueRecord[]>;
      request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
      request.onerror = () => reject(request.error ?? new Error('Failed to read queue'));
      tx.onerror = () => reject(tx.error ?? new Error('Queue transaction failed'));
      tx.onabort = () => reject(tx.error ?? new Error('Queue transaction aborted'));
    });
  } finally {
    db.close();
  }
}

async function deleteQueuedLibraryAdd(id: number) {
  const db = await openQueueDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE_NAME, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error('Failed to delete queue item'));
      tx.onerror = () => reject(tx.error ?? new Error('Queue transaction failed'));
      tx.onabort = () => reject(tx.error ?? new Error('Queue transaction aborted'));
    });
  } finally {
    db.close();
  }
}

async function flushLibrarySyncQueue() {
  const queue = await getQueuedLibraryAdds();
  if (queue.length === 0) {
    return 0;
  }

  let syncedCount = 0;
  for (const item of queue.sort((a, b) => a.createdAt - b.createdAt)) {
    if (typeof item.id !== 'number') {
      continue;
    }

    try {
      const response = await fetch(`${item.apiBase}/add`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body),
      });
      if (!response.ok) {
        continue;
      }

      await deleteQueuedLibraryAdd(item.id);
      syncedCount += 1;
    } catch {
      // Keep queued entry for a future retry.
    }
  }

  return syncedCount;
}

function parsePushPayload(event: PushEvent): PushPayload {
  if (!event.data) {
    return {};
  }

  try {
    return (event.data.json() as PushPayload) ?? {};
  } catch {
    const fallbackBody = event.data.text();
    return { body: fallbackBody };
  }
}

async function trackNotificationEvent(action: 'received' | 'open' | 'dismiss', payload: PushPayload) {
  if (!payload.notificationId) {
    return;
  }

  try {
    await fetch('/api/notifications/events', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notificationId: payload.notificationId,
        action,
        route: payload.url || '/home',
        platform: 'pwa',
      }),
    });
  } catch {
    // Best-effort analytics.
  }
}

async function runPeriodicFeedRefresh() {
  try {
    await fetch('/api/user/continue', { credentials: 'include', cache: 'no-store' });
    await fetch('/api/activity?scope=me&limit=20', { credentials: 'include', cache: 'no-store' });
  } catch {
    // Background refresh is optional.
  }
}

sw.addEventListener('message', event => {
  const messageType = (event.data as { type?: string } | null)?.type;
  if (messageType === 'CLEAR_AUTH_CACHE') {
    (event as unknown as ExtendableMessageEvent).waitUntil(clearAuthCaches());
    return;
  }

  if (messageType === 'FLUSH_LIBRARY_SYNC_QUEUE') {
    (event as unknown as ExtendableMessageEvent).waitUntil(flushLibrarySyncQueue());
    return;
  }
});

sw.addEventListener('push', event => {
  const pushEvent = event as PushEvent;
  const payload = parsePushPayload(pushEvent);
  const notificationId = payload.notificationId;
  const title = payload.title || 'Hobbistas';
  const body = payload.body || 'Open the app to see your latest updates.';
  const url = payload.url || '/home';

  pushEvent.waitUntil(
    Promise.all([
      sw.registration.showNotification(title, {
        body,
        icon: payload.icon || '/web-app-manifest-192x192.png',
        badge: payload.badge || '/web-app-manifest-192x192.png',
        tag: notificationId ? `notification-${notificationId}` : undefined,
        data: {
          url,
          notificationId: notificationId || null,
        },
      }),
      trackNotificationEvent('received', payload),
    ]),
  );
});

sw.addEventListener('notificationclick', event => {
  const notificationEvent = event as NotificationEventLike;
  notificationEvent.notification.close();
  const maybeData = notificationEvent.notification.data ?? {};
  const targetUrl = maybeData?.url || '/home';

  notificationEvent.waitUntil(
    Promise.all([
      trackNotificationEvent('open', {
        notificationId: maybeData.notificationId,
        url: targetUrl,
      }),
      sw.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then(windowClients => {
          // Find a client that belongs to this origin so we don't hijack an
          // unrelated tab that happens to have a 'focus' method.
          const appClient = windowClients.find(c =>
            c.url.startsWith(sw.location.origin),
          );
          if (appClient && 'focus' in appClient) {
            void appClient.focus();
            if ('navigate' in appClient) {
              void appClient.navigate(targetUrl);
            }
            return;
          }
          return sw.clients.openWindow(targetUrl);
        }),
    ]),
  );
});

sw.addEventListener('notificationclose', event => {
  const notificationEvent = event as NotificationEventLike;
  const maybeData = notificationEvent.notification.data ?? {};
  notificationEvent.waitUntil(
    trackNotificationEvent('dismiss', {
      notificationId: maybeData.notificationId,
      url: maybeData.url,
    }),
  );
});

sw.addEventListener('sync', event => {
  const syncEvent = event as SyncEventLike;
  if (syncEvent.tag !== LIBRARY_SYNC_TAG) {
    return;
  }
  syncEvent.waitUntil(flushLibrarySyncQueue());
});

sw.addEventListener('periodicsync', event => {
  const periodicSyncEvent = event as PeriodicSyncEventLike;
  if (periodicSyncEvent.tag !== FEED_REFRESH_SYNC_TAG) {
    return;
  }
  periodicSyncEvent.waitUntil(runPeriodicFeedRefresh());
});
