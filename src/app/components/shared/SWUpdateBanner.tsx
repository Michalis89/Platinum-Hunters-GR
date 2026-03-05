'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

function postSkipWaiting(worker: ServiceWorker | null | undefined) {
  worker?.postMessage({ type: 'SKIP_WAITING' });
}

export default function SWUpdateBanner() {
  const [show, setShow] = useState(false);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Skip showing banner on the first load after a user-triggered refresh
    if (sessionStorage.getItem('sw-update-applied')) {
      sessionStorage.removeItem('sw-update-applied');
      return;
    }

    let mounted = true;

    const bindRegistration = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) {
        waitingWorkerRef.current = registration.waiting;
        if (mounted) setShow(true);
      }

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;

        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            waitingWorkerRef.current = registration.waiting ?? worker;
            if (mounted) setShow(true);
          }
        });
      });
    };

    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) bindRegistration(registration);
    });

    const handleControllerChange = () => {
      setShow(false);
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      mounted = false;
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-24 z-[70] md:inset-x-auto md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2">
      <div className="rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
        <div className="flex items-start gap-2">
          <RefreshCcw className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">New version available</p>
            <p className="text-xs text-muted-foreground">Refresh to update the app.</p>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setShow(false)}>
            Later
          </Button>
          <Button
            size="sm"
            onClick={() => {
              sessionStorage.setItem('sw-update-applied', '1');
              postSkipWaiting(waitingWorkerRef.current);
              window.location.reload();
            }}
          >
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
