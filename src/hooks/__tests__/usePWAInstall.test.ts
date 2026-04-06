import { act, renderHook } from '@testing-library/react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

type BeforeInstallPromptEventLike = Event & {
  prompt: jest.Mock<Promise<void>>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

describe('usePWAInstall', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: jest.fn(() => ({ matches: false })),
    });
    Object.defineProperty(window.navigator, 'standalone', {
      configurable: true,
      value: false,
    });
  });

  it('tracks install availability and accepts install flow', async () => {
    const prompt = jest.fn(async () => undefined);
    const beforeInstall = new Event('beforeinstallprompt') as BeforeInstallPromptEventLike;
    beforeInstall.prompt = prompt;
    beforeInstall.userChoice = Promise.resolve({ outcome: 'accepted' });
    beforeInstall.preventDefault = jest.fn();

    const { result } = renderHook(() => usePWAInstall());
    expect(result.current.isInstalled).toBe(false);
    expect(result.current.canInstall).toBe(false);

    await act(async () => {
      window.dispatchEvent(beforeInstall);
    });
    expect(beforeInstall.preventDefault).toHaveBeenCalledTimes(1);
    expect(result.current.canInstall).toBe(true);

    await act(async () => {
      const installResult = await result.current.install();
      expect(installResult).toEqual({ outcome: 'accepted' });
    });
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(result.current.isInstalled).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it('handles dismissed install and appinstalled event', async () => {
    const prompt = jest.fn(async () => undefined);
    const beforeInstall = new Event('beforeinstallprompt') as BeforeInstallPromptEventLike;
    beforeInstall.prompt = prompt;
    beforeInstall.userChoice = Promise.resolve({ outcome: 'dismissed' });
    beforeInstall.preventDefault = jest.fn();

    const { result } = renderHook(() => usePWAInstall());
    await act(async () => {
      window.dispatchEvent(beforeInstall);
    });

    await act(async () => {
      const installResult = await result.current.install();
      expect(installResult).toEqual({ outcome: 'dismissed' });
    });
    expect(result.current.isInstalled).toBe(false);

    await act(async () => {
      window.dispatchEvent(new Event('appinstalled'));
    });
    expect(result.current.isInstalled).toBe(true);
  });

  it('returns null outcome when there is no deferred prompt and detects standalone mode', async () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: jest.fn(() => ({ matches: true })),
    });
    const { result } = renderHook(() => usePWAInstall());

    expect(result.current.isInstalled).toBe(true);
    await act(async () => {
      const installResult = await result.current.install();
      expect(installResult).toEqual({ outcome: null });
    });
  });
});
