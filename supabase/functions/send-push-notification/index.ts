import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import webpush from 'npm:web-push@3.6.7';

type PushSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type RequestBody = {
  subscription?: PushSubscription;
  notification?: {
    notificationId?: string;
    title?: string;
    body?: string;
    url?: string;
    icon?: string;
    badge?: string;
  };
};

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:support@hobbistas-hub.com';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

serve(async request => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const authHeader = request.headers.get('Authorization') ?? '';
  if (!SERVICE_ROLE_KEY || authHeader !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return json({ error: 'Unauthorized' }, 401);
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    return json({ error: 'Missing VAPID environment variables' }, 500);
  }

  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const subscription = body?.subscription;
  const notification = body?.notification;
  const hasValidSubscription =
    Boolean(subscription?.endpoint) && Boolean(subscription?.keys?.p256dh) && Boolean(subscription?.keys?.auth);
  if (!hasValidSubscription || !notification?.notificationId) {
    return json({ error: 'Invalid payload' }, 400);
  }

  const payload = JSON.stringify({
    notificationId: notification.notificationId,
    title: notification.title ?? 'Hobbistas',
    body: notification.body ?? 'Open the app to view updates.',
    url: notification.url ?? '/home',
    icon: notification.icon ?? '/web-app-manifest-192x192.png',
    badge: notification.badge ?? '/web-app-manifest-192x192.png',
  });

  try {
    await webpush.sendNotification(subscription, payload);
    return json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Push send failed';
    return json({ error: message }, 500);
  }
});
