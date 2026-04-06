'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function NotificationSettings() {
  const {
    isReady,
    isSupported,
    isSubscribed,
    isLoading,
    error,
    requiresIosInstall,
    subscribe,
    unsubscribe,
  } = usePushNotifications();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isSubscribed);
  }, [isSubscribed]);

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked);
    const success = checked ? await subscribe() : await unsubscribe();
    if (!success) {
      setEnabled(!checked);
      return;
    }

    toast.success(checked ? 'Push notifications enabled' : 'Push notifications disabled');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Push Notifications</CardTitle>
          <Badge variant="outline" className="text-[10px] uppercase tracking-[0.08em]">
            PWA
          </Badge>
        </div>
        <CardDescription>
          Get optional alerts for important updates. Payloads contain only a notification id and the
          app fetches details after tap.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Enable push notifications</p>
            <p className="text-xs text-muted-foreground">
              Works best on Android Chrome and on iOS only after installing the app to Home Screen.
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={checked => {
              void handleToggle(checked);
            }}
            disabled={!isReady || !isSupported || isLoading || requiresIosInstall}
            aria-label="Enable push notifications"
          />
        </div>

        <div className="rounded-xl border border-dashed border-border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            {enabled ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4" />}
            {enabled ? 'Push notifications are active' : 'Push notifications are off'}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            You can disable this anytime from Settings.
          </p>
        </div>

        {requiresIosInstall && (
          <Alert>
            <AlertTitle>Install required on iOS</AlertTitle>
            <AlertDescription>
              Install the app first to enable push notifications: Safari - Share - Add to Home
              Screen.
            </AlertDescription>
          </Alert>
        )}

        {!isSupported && isReady && (
          <Alert>
            <AlertTitle>Push not supported</AlertTitle>
            <AlertDescription>
              This browser does not support Web Push notifications.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Push setup failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
