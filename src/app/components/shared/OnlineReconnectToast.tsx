'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { DIARY_FLUSH_EVENT } from '@/lib/diary/offlineEvents';

export default function OnlineReconnectToast() {
  useEffect(() => {
    const handleOnline = () => {
      toast.info('Back online');
      window.dispatchEvent(new CustomEvent(DIARY_FLUSH_EVENT));
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return null;
}
