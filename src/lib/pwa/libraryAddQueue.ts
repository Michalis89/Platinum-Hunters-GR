'use client';

export const LIBRARY_SYNC_TAG = 'library-add-sync';

const DB_NAME = 'hobbistas-pwa';
const DB_VERSION = 1;
const STORE_NAME = 'library-add-queue';

type QueueRecord = {
  id?: number;
  createdAt: number;
  apiBase: string;
  body: Record<string, unknown>;
};

type SyncManagerLike = {
  register: (tag: string) => Promise<void>;
};

function hasIndexedDb() {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDb()) {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open queue database'));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => Promise<T>,
): Promise<T> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, mode);
  const store = tx.objectStore(STORE_NAME);
  try {
    return await operation(store);
  } finally {
    tx.oncomplete = () => db.close();
    tx.onerror = () => db.close();
    tx.onabort = () => db.close();
  }
}

export async function enqueueLibraryAddRequest(apiBase: string, body: Record<string, unknown>) {
  return withStore('readwrite', store => {
    return new Promise<number>((resolve, reject) => {
      const request = store.add({
        createdAt: Date.now(),
        apiBase,
        body,
      } satisfies QueueRecord);

      request.onsuccess = () => {
        const id = request.result;
        if (typeof id === 'number') {
          resolve(id);
          return;
        }
        reject(new Error('Queue insert did not return a numeric id'));
      };
      request.onerror = () => reject(request.error ?? new Error('Failed to enqueue request'));
    });
  });
}

export async function requestLibraryAddSync() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const syncManager = (registration as ServiceWorkerRegistration & { sync?: SyncManagerLike })
      .sync;
    if (syncManager) {
      await syncManager.register(LIBRARY_SYNC_TAG);
      return;
    }

    const target = registration.active ?? navigator.serviceWorker.controller;
    target?.postMessage({ type: 'FLUSH_LIBRARY_SYNC_QUEUE' });
  } catch (error) {
    console.warn('Failed to register background sync:', error);
  }
}

export async function flushLibraryAddQueue(): Promise<number> {
  // Step 1: Read all queued items in a dedicated readonly transaction that closes
  // cleanly before any async fetch() calls happen. Mixing `await fetch()` inside a
  // single IDB transaction causes the transaction to auto-commit (no pending requests
  // while waiting on the network), so any subsequent store.delete() silently fails and
  // items are never removed — causing them to be re-sent on every reconnect.
  let items: QueueRecord[] = [];
  try {
    items = await withStore(
      'readonly',
      store =>
        new Promise<QueueRecord[]>((resolve, reject) => {
          const request = store.getAll() as IDBRequest<QueueRecord[]>;
          request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
          request.onerror = () =>
            reject(request.error ?? new Error('Failed to read queued requests'));
        }),
    );
  } catch {
    return 0;
  }

  if (items.length === 0) {
    return 0;
  }

  let syncedCount = 0;
  for (const item of items.sort((a, b) => a.createdAt - b.createdAt)) {
    if (typeof item.id !== 'number') {
      continue;
    }

    try {
      // Step 2: Fetch happens fully outside any IDB transaction.
      const response = await fetch(`${item.apiBase}/add`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body),
      });

      if (!response.ok) {
        continue;
      }

      // Step 3: Delete in its own fresh readwrite transaction so no async work
      // can cause an auto-commit before the delete request is issued.
      const idToDelete = item.id;
      await withStore(
        'readwrite',
        store =>
          new Promise<void>((resolve, reject) => {
            const request = store.delete(idToDelete);
            request.onsuccess = () => resolve();
            request.onerror = () =>
              reject(request.error ?? new Error('Failed to delete queue item'));
          }),
      );

      syncedCount += 1;
    } catch {
      // Keep failed items in queue for next retry.
    }
  }

  return syncedCount;
}
