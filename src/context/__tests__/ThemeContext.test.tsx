import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

const STORAGE_KEY = 'hobbistas-hub-theme';

// ---------------------------------------------------------------------------
// matchMedia mock helpers
// ---------------------------------------------------------------------------
let mediaListeners: Array<(e: Partial<MediaQueryListEvent>) => void> = [];

function setupMatchMedia(systemDark = false) {
  mediaListeners = [];
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: jest.fn().mockReturnValue({
      matches: systemDark,
      media: '(prefers-color-scheme: dark)',
      addEventListener: jest.fn((_: string, fn: (e: Partial<MediaQueryListEvent>) => void) => {
        mediaListeners.push(fn);
      }),
      removeEventListener: jest.fn((_: string, fn: (e: Partial<MediaQueryListEvent>) => void) => {
        mediaListeners = mediaListeners.filter(l => l !== fn);
      }),
      dispatchEvent: jest.fn(),
    }),
  });
}

function triggerOsThemeChange(dark: boolean) {
  mediaListeners.forEach(fn => fn({ matches: dark } as MediaQueryListEvent));
}

// ---------------------------------------------------------------------------
// Default wrapper
// ---------------------------------------------------------------------------
const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ThemeContext', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    setupMatchMedia();
    localStorage.clear();
    document.cookie = 'theme=; max-age=0; path=/';
    document.cookie = 'theme-preference=; max-age=0; path=/';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark', 'theme-animating');
  });

  // -------------------------------------------------------------------------
  // useTheme guard
  // -------------------------------------------------------------------------
  describe('useTheme', () => {
    it('throws when used outside ThemeProvider', () => {
      expect(() => renderHook(() => useTheme())).toThrow(
        'useTheme must be used within a ThemeProvider',
      );
    });
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------
  describe('ThemeProvider initial state', () => {
    it('provides dark theme and system preference by default', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });
      expect(result.current.theme).toBe('dark');
      expect(result.current.themePreference).toBe('system');
    });

    it('sets hasMounted and applies dark theme to DOM after mount', async () => {
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});
      expect(result.current.hasMounted).toBe(true);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('applies light theme to DOM when initialTheme is light', async () => {
      const lightWrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider initialTheme="light" initialPreference="light">
          {children}
        </ThemeProvider>
      );
      renderHook(() => useTheme(), { wrapper: lightWrapper });
      await act(async () => {});
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  // -------------------------------------------------------------------------
  // localStorage on mount
  // -------------------------------------------------------------------------
  describe('localStorage hydration on mount', () => {
    it('reads stored "light" preference and resolves theme to light', async () => {
      localStorage.setItem(STORAGE_KEY, 'light');
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});
      expect(result.current.themePreference).toBe('light');
      expect(result.current.theme).toBe('light');
    });

    it('reads stored "dark" preference and resolves theme to dark', async () => {
      localStorage.setItem(STORAGE_KEY, 'dark');
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});
      expect(result.current.themePreference).toBe('dark');
      expect(result.current.theme).toBe('dark');
    });

    it('reads stored "system" preference and resolves via matchMedia (dark)', async () => {
      setupMatchMedia(true);
      localStorage.setItem(STORAGE_KEY, 'system');
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});
      expect(result.current.themePreference).toBe('system');
      expect(result.current.theme).toBe('dark');
    });

    it('reads stored "system" preference and resolves via matchMedia (light)', async () => {
      setupMatchMedia(false);
      localStorage.setItem(STORAGE_KEY, 'system');
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});
      expect(result.current.themePreference).toBe('system');
      expect(result.current.theme).toBe('light');
    });

    it('ignores invalid stored preference and falls back to initialTheme', async () => {
      localStorage.setItem(STORAGE_KEY, 'invalid');
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});
      expect(result.current.theme).toBe('dark');
    });

    it('applies initialTheme when localStorage.getItem throws', async () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('storage unavailable');
      });
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});
      expect(result.current.hasMounted).toBe(true);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  // -------------------------------------------------------------------------
  // OS theme change listener
  // -------------------------------------------------------------------------
  describe('OS theme change listener', () => {
    it('updates theme to dark when OS switches to dark and preference is system', async () => {
      setupMatchMedia(false);
      localStorage.setItem(STORAGE_KEY, 'system');
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});
      expect(result.current.theme).toBe('light');

      act(() => {
        triggerOsThemeChange(true);
      });

      expect(result.current.theme).toBe('dark');
    });

    it('updates theme to light when OS switches to light and preference is system', async () => {
      setupMatchMedia(true);
      localStorage.setItem(STORAGE_KEY, 'system');
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});
      expect(result.current.theme).toBe('dark');

      act(() => {
        triggerOsThemeChange(false);
      });

      expect(result.current.theme).toBe('light');
    });

    it('ignores OS theme changes when preference is not system', async () => {
      localStorage.setItem(STORAGE_KEY, 'dark');
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});

      act(() => {
        triggerOsThemeChange(false);
      });

      expect(result.current.theme).toBe('dark');
    });
  });

  // -------------------------------------------------------------------------
  // toggleTheme
  // -------------------------------------------------------------------------
  describe('toggleTheme', () => {
    it('toggles from dark to light', async () => {
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});

      act(() => {
        result.current.toggleTheme();
      });
      await act(async () => {});

      expect(result.current.theme).toBe('light');
      expect(result.current.themePreference).toBe('light');
    });

    it('toggles from light to dark', async () => {
      const lightWrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider initialTheme="light" initialPreference="light">
          {children}
        </ThemeProvider>
      );
      const { result } = renderHook(() => useTheme(), { wrapper: lightWrapper });
      await act(async () => {});

      act(() => {
        result.current.toggleTheme();
      });
      await act(async () => {});

      expect(result.current.theme).toBe('dark');
    });
  });

  // -------------------------------------------------------------------------
  // setTheme
  // -------------------------------------------------------------------------
  describe('setTheme', () => {
    it('is a no-op when called with the current theme', async () => {
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});

      act(() => {
        result.current.setTheme('dark'); // same as initial
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.themePreference).toBe('system'); // unchanged
    });

    it('changes theme when called with a different value', async () => {
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});

      act(() => {
        result.current.setTheme('light');
      });
      await act(async () => {});

      expect(result.current.theme).toBe('light');
    });
  });

  // -------------------------------------------------------------------------
  // setThemePreference
  // -------------------------------------------------------------------------
  describe('setThemePreference', () => {
    it('is a no-op when called with the current preference', async () => {
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});

      act(() => {
        result.current.setThemePreference('system'); // same as initial
      });

      expect(result.current.themePreference).toBe('system');
    });

    it('changes preference and resolves theme to light', async () => {
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});

      act(() => {
        result.current.setThemePreference('light');
      });
      await act(async () => {});

      expect(result.current.themePreference).toBe('light');
      expect(result.current.theme).toBe('light');
    });

    it('changes preference to system and resolves via matchMedia', async () => {
      setupMatchMedia(true);
      localStorage.setItem(STORAGE_KEY, 'light');
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});
      expect(result.current.themePreference).toBe('light');

      act(() => {
        result.current.setThemePreference('system');
      });
      await act(async () => {});

      expect(result.current.themePreference).toBe('system');
      expect(result.current.theme).toBe('dark');
    });

    it('does not throw when localStorage.setItem throws', async () => {
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});

      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('storage unavailable');
      });

      expect(() => {
        act(() => {
          result.current.setThemePreference('light');
        });
      }).not.toThrow();

      expect(result.current.themePreference).toBe('light');
    });

    it('clears the existing transition timeout when called in quick succession', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {
        jest.runAllTimers();
      });

      // First call — sets themeTransitionTimeout to a non-null value
      act(() => {
        result.current.setThemePreference('light');
      });

      // Second call before the 200 ms animation timer fires — exercises clearTimeout branch
      act(() => {
        result.current.setThemePreference('dark');
      });

      jest.runAllTimers();
      jest.useRealTimers();

      expect(result.current.themePreference).toBe('dark');
    });
  });

  // -------------------------------------------------------------------------
  // applyThemeToDom / DOM side-effects
  // -------------------------------------------------------------------------
  describe('DOM side-effects', () => {
    it('sets data-theme attribute to dark', async () => {
      renderHook(() => useTheme(), { wrapper });
      await act(async () => {});
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('adds dark class when theme is dark', async () => {
      renderHook(() => useTheme(), { wrapper });
      await act(async () => {});
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes dark class when theme changes to light', async () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {
        jest.runAllTimers();
      });

      act(() => {
        result.current.setThemePreference('light');
      });
      await act(async () => {
        jest.runAllTimers();
      });

      jest.useRealTimers();
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('sets document cookie when theme is applied', async () => {
      jest.useFakeTimers();
      renderHook(() => useTheme(), { wrapper });
      await act(async () => {
        jest.runAllTimers();
      });
      jest.useRealTimers();
      expect(document.cookie).toContain('theme=dark');
    });
  });
});
