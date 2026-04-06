import { act, renderHook, waitFor } from '@testing-library/react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

type MockSubscription = {
  toJSON: jest.Mock;
  unsubscribe: jest.Mock<Promise<boolean>>;
};

function createSubscription(
  json: {
    endpoint?: string;
    expirationTime?: number | null;
    keys?: { p256dh?: string; auth?: string };
  } = {
    endpoint: 'https://push.endpoint/sub',
    expirationTime: null,
    keys: { p256dh: 'p256', auth: 'auth' },
  },
): MockSubscription {
  return {
    toJSON: jest.fn(() => json),
    unsubscribe: jest.fn(async () => true),
  };
}

function setupPushEnv({
  supported = true,
  permission = 'default' as NotificationPermission,
  requestPermissionResult = 'granted' as NotificationPermission,
  userAgent = 'Mozilla/5.0',
  standalone = false,
  existingSubscription = null as MockSubscription | null,
  subscribedSubscription = null as MockSubscription | null,
} = {}) {
  Object.defineProperty(window.navigator, 'userAgent', {
    configurable: true,
    value: userAgent,
  });
  Object.defineProperty(window.navigator, 'standalone', {
    configurable: true,
    value: standalone,
  });
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: jest.fn(() => ({ matches: standalone })),
  });

  const getSubscription = jest.fn(async () => existingSubscription);
  const subscribe = jest.fn(async () => subscribedSubscription ?? createSubscription());
  const registration = { pushManager: { getSubscription, subscribe } };

  if (supported) {
    Object.defineProperty(window, 'PushManager', {
      configurable: true,
      value: function PushManager() {},
    });
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: { ready: Promise.resolve(registration) },
    });
  } else {
    delete (window as unknown as Record<string, unknown>).PushManager;
    delete (window.navigator as unknown as Record<string, unknown>).serviceWorker;
  }

  const requestPermission = jest.fn(async () => requestPermissionResult);
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    value: {
      permission,
      requestPermission,
    },
  });

  return { registration, getSubscription, subscribe, requestPermission };
}

describe('usePushNotifications', () => {
  const originalVapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'BEl9VapidMock___abc123';
    global.fetch = jest.fn(async () => ({ ok: true })) as jest.Mock;
  });

  afterEach(() => {
    if (originalVapid === undefined) {
      delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    } else {
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = originalVapid;
    }
  });

  it('marks unsupported browsers and handles unsupported subscribe/unsubscribe', async () => {
    setupPushEnv({ supported: false });

    const { result } = renderHook(() => usePushNotifications());
    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });
    expect(result.current.isSupported).toBe(false);
    expect(result.current.permission).toBe('default');

    await act(async () => {
      const subscribed = await result.current.subscribe();
      expect(subscribed).toBe(false);
    });
    expect(result.current.error).toBe('Push notifications are not supported on this browser.');

    await act(async () => {
      const unsubscribed = await result.current.unsubscribe();
      expect(unsubscribed).toBe(false);
    });

    await act(async () => {
      await result.current.refreshSubscription();
    });
    expect(result.current.isSubscribed).toBe(false);
  });

  it('detects iOS non-standalone requirement and blocks subscription', async () => {
    setupPushEnv({
      supported: true,
      userAgent: 'iPhone',
      standalone: false,
      permission: 'granted',
    });
    const { result } = renderHook(() => usePushNotifications());

    expect(result.current.isIos).toBe(true);
    expect(result.current.isStandalone).toBe(false);
    expect(result.current.requiresIosInstall).toBe(true);

    await act(async () => {
      const ok = await result.current.subscribe();
      expect(ok).toBe(false);
    });
    expect(result.current.error).toBe('Install the app first to enable push notifications on iOS.');
  });

  it('refreshSubscription handles success, unsupported and errors', async () => {
    const existing = createSubscription();
    const { getSubscription } = setupPushEnv({
      supported: true,
      existingSubscription: existing,
      permission: 'granted',
    });

    const { result } = renderHook(() => usePushNotifications());
    await waitFor(() => {
      expect(result.current.isSubscribed).toBe(true);
    });
    expect(getSubscription).toHaveBeenCalled();

    await act(async () => {
      await result.current.refreshSubscription();
    });
    expect(result.current.isSubscribed).toBe(true);

    const badReady = Promise.reject(new Error('ready fail'));
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: { ready: badReady },
    });
    await act(async () => {
      await result.current.refreshSubscription();
    });
    expect(result.current.isSubscribed).toBe(false);
  });

  it('subscribes successfully with existing subscription and granted permission', async () => {
    const existing = createSubscription();
    const { subscribe, requestPermission } = setupPushEnv({
      supported: true,
      permission: 'granted',
      existingSubscription: existing,
    });
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      const ok = await result.current.subscribe();
      expect(ok).toBe(true);
    });

    expect(requestPermission).not.toHaveBeenCalled();
    expect(subscribe).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/notifications/subscribe',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.permission).toBe('granted');
  });

  it('subscribes successfully by creating a new subscription when missing', async () => {
    const created = createSubscription();
    const { subscribe } = setupPushEnv({
      supported: true,
      permission: 'default',
      requestPermissionResult: 'granted',
      existingSubscription: null,
      subscribedSubscription: created,
    });
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      const ok = await result.current.subscribe();
      expect(ok).toBe(true);
    });
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(result.current.isSubscribed).toBe(true);
  });

  it('subscribe handles permission denied, missing vapid, invalid payload, and server failures', async () => {
    const deniedEnv = setupPushEnv({
      supported: true,
      permission: 'default',
      requestPermissionResult: 'denied',
    });
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      const ok = await result.current.subscribe();
      expect(ok).toBe(false);
    });
    expect(deniedEnv.requestPermission).toHaveBeenCalled();
    expect(result.current.error).toBe('Notification permission was not granted.');

    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    await act(async () => {
      const ok = await result.current.subscribe();
      expect(ok).toBe(false);
    });
    expect(result.current.error).toBe('Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable.');
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'BEl9VapidMock___abc123';

    const incomplete = createSubscription({
      endpoint: '',
      expirationTime: null,
      keys: { p256dh: 'p', auth: 'a' },
    });
    setupPushEnv({
      supported: true,
      permission: 'granted',
      existingSubscription: incomplete,
    });
    await act(async () => {
      const ok = await result.current.subscribe();
      expect(ok).toBe(false);
    });
    expect(result.current.error).toBe('Push subscription payload is incomplete.');

    setupPushEnv({
      supported: true,
      permission: 'granted',
      existingSubscription: createSubscription(),
    });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'server said no' }),
    });
    await act(async () => {
      const ok = await result.current.subscribe();
      expect(ok).toBe(false);
    });
    expect(result.current.error).toBe('server said no');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error('bad json');
      },
    });
    await act(async () => {
      const ok = await result.current.subscribe();
      expect(ok).toBe(false);
    });
    expect(result.current.error).toBe('Failed to save push subscription.');

    setupPushEnv({
      supported: true,
      permission: 'granted',
      existingSubscription: createSubscription(),
    });
    (global.fetch as jest.Mock).mockRejectedValueOnce('boom-string');
    await act(async () => {
      const ok = await result.current.subscribe();
      expect(ok).toBe(false);
    });
    expect(result.current.error).toBe('Could not enable push notifications.');
  });

  it('unsubscribe handles no subscription, success cleanup and errors', async () => {
    const emptyEnv = setupPushEnv({
      supported: true,
      permission: 'granted',
      existingSubscription: null,
    });
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      const ok = await result.current.unsubscribe();
      expect(ok).toBe(true);
    });
    expect(emptyEnv.getSubscription).toHaveBeenCalled();
    expect(result.current.isSubscribed).toBe(false);

    const withEndpoint = createSubscription();
    setupPushEnv({
      supported: true,
      permission: 'granted',
      existingSubscription: withEndpoint,
    });
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/notifications/subscribe') {
        return Promise.reject(new Error('cleanup failed'));
      }
      return Promise.resolve({ ok: true });
    });
    await act(async () => {
      const ok = await result.current.unsubscribe();
      expect(ok).toBe(true);
    });
    expect(withEndpoint.unsubscribe).toHaveBeenCalledTimes(1);
    expect(result.current.isSubscribed).toBe(false);

    const noEndpoint = createSubscription({
      endpoint: undefined,
      keys: { p256dh: 'p', auth: 'a' },
    });
    setupPushEnv({
      supported: true,
      permission: 'granted',
      existingSubscription: noEndpoint,
    });
    await act(async () => {
      const ok = await result.current.unsubscribe();
      expect(ok).toBe(true);
    });

    const boomSub = createSubscription();
    boomSub.unsubscribe.mockRejectedValueOnce(new Error('unsubscribe fail'));
    setupPushEnv({
      supported: true,
      permission: 'granted',
      existingSubscription: boomSub,
    });
    await act(async () => {
      const ok = await result.current.unsubscribe();
      expect(ok).toBe(false);
    });
    expect(result.current.error).toBe('unsubscribe fail');

    setupPushEnv({
      supported: true,
      permission: 'granted',
      existingSubscription: createSubscription(),
    });
    (window.navigator.serviceWorker as unknown as Record<string, unknown>).ready = Promise.reject('bad-unsubscribe');
    await act(async () => {
      const ok = await result.current.unsubscribe();
      expect(ok).toBe(false);
    });
    expect(result.current.error).toBe('Could not disable push notifications.');
  });
});
