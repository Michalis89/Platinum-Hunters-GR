import type { DiaryMood } from '@/lib/diary/types';

const DB_NAME = 'hobbistas-pwa';
const DB_VERSION = 1;
const STORE_NAME = 'diary_offline_drafts';

export type OfflineDiaryDraft = {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood: DiaryMood | null;
  entryDate: string;
  updatedAt: string;
};

function supportsIndexedDb() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function openDb(): Promise<IDBDatabase | null> {
  if (!supportsIndexedDb()) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => Promise<T>,
): Promise<T> {
  const db = await openDb();
  if (!db) {
    throw new Error('IndexedDB is not available in this environment');
  }

  const tx = db.transaction(STORE_NAME, mode);
  const store = tx.objectStore(STORE_NAME);

  try {
    const result = await operation(store);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    return result;
  } finally {
    db.close();
  }
}

export async function saveOfflineDraft(draft: OfflineDiaryDraft): Promise<void> {
  await withStore('readwrite', store => {
    return new Promise<void>((resolve, reject) => {
      const request = store.put(draft);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

export async function getOfflineDraft(entryId: string): Promise<OfflineDiaryDraft | null> {
  return withStore('readonly', store => {
    return new Promise<OfflineDiaryDraft | null>((resolve, reject) => {
      const request = store.get(entryId);
      request.onsuccess = () => resolve((request.result as OfflineDiaryDraft | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
  });
}

export async function listOfflineDrafts(): Promise<OfflineDiaryDraft[]> {
  return withStore('readonly', store => {
    return new Promise<OfflineDiaryDraft[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        resolve((request.result as OfflineDiaryDraft[] | undefined) ?? []);
      };
      request.onerror = () => reject(request.error);
    });
  });
}

export async function deleteOfflineDraft(entryId: string): Promise<void> {
  await withStore('readwrite', store => {
    return new Promise<void>((resolve, reject) => {
      const request = store.delete(entryId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}
