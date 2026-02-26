'use client';

import { useEffect, useMemo, useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DISMISS_KEY = 'ios-install-hint-dismissed';
const VISITS_KEY = 'pwa-visit-count';
const MIN_VISITS = 3;

function isIOSDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(ua);
}

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches;
}

export default function IOSInstallHint() {
  const [visible, setVisible] = useState(false);
  const [visits, setVisits] = useState(0);
  const isIOS = useMemo(() => isIOSDevice(), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const current = Number(window.localStorage.getItem(VISITS_KEY) ?? '0');
    setVisits(current);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isIOS || isStandaloneMode()) return;
    if (!navigator.onLine) return;
    if (visits < MIN_VISITS) return;
    if (window.localStorage.getItem(DISMISS_KEY) === '1') return;

    const timer = window.setTimeout(() => setVisible(true), 1500);
    return () => window.clearTimeout(timer);
  }, [isIOS, visits]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-20 z-[60] md:inset-x-auto md:bottom-4 md:right-4 md:w-[360px]">
      <div className="rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
        <div className="flex items-start gap-2">
          <Share2 className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Install on iPhone</p>
            <p className="text-xs text-muted-foreground">
              Open Share, then tap Add to Home Screen for the app-like experience.
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            size="sm"
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={() => {
              localStorage.setItem(DISMISS_KEY, '1');
              setVisible(false);
            }}
          >
            Don&apos;t show again
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setVisible(false)}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
