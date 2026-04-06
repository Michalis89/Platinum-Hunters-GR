'use client';

import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { toast } from 'sonner';

import { CONTENT_PUBLISHED_EVENT } from '@/app/constants/contentEvents';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const DISMISS_FOREVER_KEY = 'push-optin-dismiss-forever';
const SESSION_DISMISS_KEY = 'push-optin-dismiss-session';

export default function PushOptInPrompt() {
  const [visible, setVisible] = useState(false);
  const { isReady, isSupported, isSubscribed, isLoading, requiresIosInstall, error, subscribe } =
    usePushNotifications();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.localStorage.getItem(DISMISS_FOREVER_KEY) === '1') {
      return;
    }

    const handleContentPublished = () => {
      if (
        window.localStorage.getItem(DISMISS_FOREVER_KEY) === '1' ||
        window.sessionStorage.getItem(SESSION_DISMISS_KEY) === '1'
      ) {
        return;
      }

      setVisible(true);
    };

    window.addEventListener(CONTENT_PUBLISHED_EVENT, handleContentPublished);
    return () => {
      window.removeEventListener(CONTENT_PUBLISHED_EVENT, handleContentPublished);
    };
  }, []);

  if (!visible || !isReady || !isSupported || isSubscribed) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-20 z-[60] md:inset-x-auto md:bottom-4 md:right-4 md:w-[380px]">
      <div className="rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
        <div className="flex items-start gap-2">
          <BellRing className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Stay updated</p>
            <p className="text-xs text-muted-foreground">
              Enable push notifications for important updates.
            </p>
            {requiresIosInstall ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Install the app first to enable push notifications on iOS.
              </p>
            ) : null}
            {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <Button
            size="sm"
            variant="primary"
            disabled={isLoading || requiresIosInstall}
            onClick={async () => {
              const success = await subscribe();
              if (success) {
                toast.success('Push notifications enabled');
                setVisible(false);
              }
            }}
          >
            Enable notifications
          </Button>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="flex-1"
              onClick={() => {
                window.sessionStorage.setItem(SESSION_DISMISS_KEY, '1');
                setVisible(false);
              }}
            >
              Not now
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => {
                window.localStorage.setItem(DISMISS_FOREVER_KEY, '1');
                setVisible(false);
              }}
            >
              Don&apos;t ask again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
