'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useIsMobile } from '@/hooks/use-mobile';

const DISMISS_KEY = 'pwa-install-prompt-dismissed';
const VISITS_KEY = 'pwa-visit-count';
const MIN_VISITS = 3;

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isAndroid() {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export default function InstallPrompt() {
  const { canInstall, install, isInstalled } = usePWAInstall();
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);
  const [visits, setVisits] = useState(0);
  const isiOS = useMemo(() => isIOS(), []);
  const isAndroidDevice = useMemo(() => isAndroid(), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const current = Number(window.localStorage.getItem(VISITS_KEY) ?? '0') + 1;
    window.localStorage.setItem(VISITS_KEY, String(current));
    setVisits(current);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isMobile || !isAndroidDevice || isiOS || isInstalled || !canInstall) return;
    if (visits < MIN_VISITS) return;
    if (window.localStorage.getItem(DISMISS_KEY) === '1') return;

    const timer = window.setTimeout(() => setVisible(true), 1200);
    return () => window.clearTimeout(timer);
  }, [canInstall, isInstalled, isiOS, isAndroidDevice, isMobile, visits]);

  if (!visible || !canInstall || !isMobile || !isAndroidDevice || isiOS || isInstalled) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-20 z-[60]">
      <div className="rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
        <div className="flex items-start gap-2">
          <Download className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Install Hobbistas</p>
            <p className="text-xs text-muted-foreground">
              Add the app to your home screen for faster launch and offline support.
            </p>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              localStorage.setItem(DISMISS_KEY, '1');
              setVisible(false);
            }}
          >
            Not now
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              await install();
              setVisible(false);
            }}
          >
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}
