'use client';

import { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export default function OfflineBanner() {
  const isOnline = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 top-3 z-[70] md:inset-x-auto md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card/95 px-3 py-2 text-sm shadow-lg backdrop-blur">
        <WifiOff className="h-4 w-4 text-warning" aria-hidden="true" />
        <p className="font-medium text-foreground">Offline mode</p>
        <p className="ml-auto text-xs text-muted-foreground">Some pages may be cached</p>
      </div>
    </div>
  );
}
