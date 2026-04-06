import { act, renderHook } from '@testing-library/react';
import { useIsMobile } from '@/hooks/use-mobile';

describe('useIsMobile', () => {
  it('returns false by default and updates on media change', () => {
    const listeners = new Set<() => void>();
    const mql = {
      addEventListener: jest.fn((_type: string, cb: () => void) => listeners.add(cb)),
      removeEventListener: jest.fn((_type: string, cb: () => void) => listeners.delete(cb)),
    };
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn(() => mql),
    });

    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true });
    const { result, unmount } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
      listeners.forEach(cb => cb());
    });
    expect(result.current).toBe(true);

    unmount();
    expect(mql.removeEventListener).toHaveBeenCalledTimes(1);
  });
});
