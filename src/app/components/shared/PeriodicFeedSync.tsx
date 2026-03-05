'use client';

import { useEffect } from 'react';

type PeriodicSyncManagerLike = {
  register: (tag: string, options: { minInterval: number }) => Promise<void>;
};

const FEED_REFRESH_SYNC_TAG = 'feed-refresh';
const MIN_INTERVAL_MS = 12 * 60 * 60 * 1000;

export default function PeriodicFeedSync() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const periodicSyncManager = (
          registration as ServiceWorkerRegistration & { periodicSync?: PeriodicSyncManagerLike }
        ).periodicSync;

        if (!periodicSyncManager) {
          return;
        }

        await periodicSyncManager.register(FEED_REFRESH_SYNC_TAG, {
          minInterval: MIN_INTERVAL_MS,
        });
      } catch {
        // Not supported/allowed on this platform.
      }
    };

    void register();
  }, []);

  return null;
}
