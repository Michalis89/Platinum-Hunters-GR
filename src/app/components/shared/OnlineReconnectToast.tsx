'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { DIARY_FLUSH_EVENT } from '@/lib/diary/offlineEvents';
import { requestLibraryAddSync } from '@/lib/pwa/libraryAddQueue';

export default function OnlineReconnectToast() {
  useEffect(() => {
    const handleOnline = () => {
      toast.info('Back online');
      window.dispatchEvent(new CustomEvent(DIARY_FLUSH_EVENT));
      // requestLibraryAddSync registers Background Sync (Android Chrome) or falls back
      // to a direct SW postMessage — both paths flush the queue. Calling
      // flushLibraryAddQueue() here as well would cause duplicate POSTs.
      void requestLibraryAddSync();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return null;
}
