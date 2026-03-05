'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type PushSubscriptionPayload = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type PushSubscriptionJson = {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

function isIosDevice() {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isStandaloneMode() {
  if (typeof window === 'undefined') {
    return false;
  }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const normalized = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(normalized);
  const outputArray = new Uint8Array(rawData.length);
  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }
  return outputArray;
}

function normalizeSubscription(subscription: PushSubscription): PushSubscriptionPayload | null {
  const json = subscription.toJSON() as PushSubscriptionJson;
  const endpoint = typeof json.endpoint === 'string' ? json.endpoint : '';
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return null;
  }

  return {
    endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: {
      p256dh,
      auth,
    },
  };
}

export function usePushNotifications() {
  const [isSupported, setSupported] = useState(false);
  const [isSubscribed, setSubscribed] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [error, setError] = useState<string | null>(null);
  const [isReady, setReady] = useState(false);

  const isIos = useMemo(() => isIosDevice(), []);
  const isStandalone = useMemo(() => isStandaloneMode(), []);
  const requiresIosInstall = isIos && !isStandalone;

  const refreshSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setSubscribed(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setSubscribed(Boolean(subscription));
    } catch {
      setSubscribed(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setSupported(supported);
    setPermission(supported ? Notification.permission : 'default');
    setReady(true);

    if (!supported) {
      return;
    }

    void refreshSubscription();
  }, [refreshSubscription]);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError('Push notifications are not supported on this browser.');
      return false;
    }

    if (requiresIosInstall) {
      setError('Install the app first to enable push notifications on iOS.');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable.');
      }

      if (Notification.permission !== 'granted') {
        const nextPermission = await Notification.requestPermission();
        setPermission(nextPermission);
        if (nextPermission !== 'granted') {
          throw new Error('Notification permission was not granted.');
        }
      } else {
        setPermission('granted');
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      const payload = normalizeSubscription(subscription);
      if (!payload) {
        throw new Error('Push subscription payload is incomplete.');
      }

      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: payload,
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'Failed to save push subscription.');
      }

      setSubscribed(true);
      return true;
    } catch (subscribeError) {
      setError(
        subscribeError instanceof Error
          ? subscribeError.message
          : 'Could not enable push notifications.',
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported, requiresIosInstall]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) {
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setSubscribed(false);
        return true;
      }

      const payload = normalizeSubscription(subscription);
      const endpoint = payload?.endpoint;

      await subscription.unsubscribe();

      // Mark as unsubscribed immediately — the browser endpoint is gone
      // regardless of whether the server cleanup succeeds. If the server
      // DELETE fails the subscription record becomes stale but push delivery
      // will fail naturally once the endpoint expires, so the UI state is correct.
      setSubscribed(false);

      if (endpoint) {
        fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        }).catch(() => {
          // Best-effort server cleanup — non-fatal.
        });
      }

      return true;
    } catch (unsubscribeError) {
      setError(
        unsubscribeError instanceof Error
          ? unsubscribeError.message
          : 'Could not disable push notifications.',
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  return {
    isReady,
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    error,
    isIos,
    isStandalone,
    requiresIosInstall,
    subscribe,
    unsubscribe,
    refreshSubscription,
  };
}
