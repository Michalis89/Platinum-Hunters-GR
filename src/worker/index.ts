/// <reference lib="webworker" />

const AUTH_CACHE_NAMES = new Set(['auth-pages', 'supabase-rest']);

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

self.addEventListener('message', event => {
  const messageType = (event.data as { type?: string } | null)?.type;
  if (messageType !== 'CLEAR_AUTH_CACHE') {
    return;
  }

  (event as ExtendableMessageEvent).waitUntil(clearAuthCaches());
});
