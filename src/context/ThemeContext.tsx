'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from 'react';

type Theme = 'dark' | 'light';
type ThemePreference = 'system' | 'dark' | 'light';

interface ThemeContextType {
  theme: Theme; // Resolved theme (what's actually applied)
  themePreference: ThemePreference; // User's preference (can be 'system')
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setThemePreference: (preference: ThemePreference) => void;
  hasMounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'hobbistas-hub-theme';
const THEME_COOKIE_NAME = 'theme';
const THEME_PREFERENCE_COOKIE_NAME = 'theme-preference';
const THEME_TRANSITION_CLASS = 'theme-animating';
const THEME_TRANSITION_MS = 200; // Optimized for 60fps performance
let themeTransitionTimeout: number | null = null;

function setThemeCookie(theme: Theme) {
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

function setThemePreferenceCookie(preference: ThemePreference) {
  document.cookie = `${THEME_PREFERENCE_COOKIE_NAME}=${preference}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

function getSystemTheme(): Theme {
  /* istanbul ignore next -- SSR-only guard; jsdom tests always provide window */
  /* c8 ignore next 3 */
  if (typeof window === 'undefined') {
    return 'dark';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveThemePreference(preference: ThemePreference): Theme {
  if (preference === 'system') {
    return getSystemTheme();
  }
  return preference;
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'dark' || value === 'light';
}

function readStoredThemePreference(fallback: ThemePreference): ThemePreference {
  /* c8 ignore next */
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const storedPreference = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(storedPreference) ? storedPreference : fallback;
  } catch {
    return fallback;
  }
}

function readInitialTheme(
  initialTheme: Theme,
  initialPreference: ThemePreference,
): { theme: Theme; preference: ThemePreference } {
  const preference = readStoredThemePreference(initialPreference);

  try {
    const storedPreference = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemePreference(storedPreference)) {
      return {
        preference: storedPreference,
        theme: resolveThemePreference(storedPreference),
      };
    }
  } catch {
    return { preference, theme: initialTheme };
  }

  return { preference, theme: initialTheme };
}

function applyThemeTransitionClass() {
  const htmlEl = document.documentElement;

  if (themeTransitionTimeout !== null) {
    window.clearTimeout(themeTransitionTimeout);
  }

  htmlEl.classList.add(THEME_TRANSITION_CLASS);
  themeTransitionTimeout = window.setTimeout(() => {
    htmlEl.classList.remove(THEME_TRANSITION_CLASS);
    themeTransitionTimeout = null;
  }, THEME_TRANSITION_MS);
}

function applyThemeToDom(theme: Theme) {
  const htmlEl = document.documentElement;
  htmlEl.setAttribute('data-theme', theme);
  htmlEl.classList.toggle('dark', theme === 'dark');
  setThemeCookie(theme);
}

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: Theme;
  initialPreference?: ThemePreference;
}

export function ThemeProvider({
  children,
  initialTheme = 'dark',
  initialPreference = 'system',
}: ThemeProviderProps) {
  const initialState = useMemo(
    () => readInitialTheme(initialTheme, initialPreference),
    [initialTheme, initialPreference],
  );
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() =>
    initialState.preference,
  );
  const [theme, setThemeState] = useState<Theme>(() => initialState.theme);
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Keep DOM attributes/cookies/storage in sync with current theme state.
  useEffect(() => {
    try {
      const storedPreference = localStorage.getItem(THEME_STORAGE_KEY);
      if (!isThemePreference(storedPreference)) {
        localStorage.setItem(THEME_STORAGE_KEY, themePreference);
      }
    } catch {
      // ignore storage failures
    }

    setThemePreferenceCookie(themePreference);
    applyThemeToDom(theme);
  }, [theme, themePreference]);

  // Follow OS theme changes when preference is 'system'
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      if (themePreference !== 'system') {
        return;
      }

      const newTheme: Theme = e.matches ? 'dark' : 'light';
      setThemeState(newTheme);
      applyThemeToDom(newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themePreference]);

  const setThemePreference = useCallback(
    (preference: ThemePreference) => {
      if (preference === themePreference) {
        return;
      }

      const resolvedTheme = resolveThemePreference(preference);

      applyThemeTransitionClass();
      setThemePreferenceState(preference);
      setThemeState(resolvedTheme);

      window.setTimeout(() => {
        applyThemeToDom(resolvedTheme);
        setThemePreferenceCookie(preference);
      }, 0);

      try {
        localStorage.setItem(THEME_STORAGE_KEY, preference);
      } catch {
        // ignore storage failures
      }
    },
    [themePreference],
  );

  const setTheme = useCallback(
    (newTheme: Theme) => {
      if (newTheme === theme) {
        return;
      }

      // Setting an explicit theme changes preference to that theme (not 'system')
      setThemePreference(newTheme);
    },
    [theme, setThemePreference],
  );

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    // When toggling, always set an explicit preference (not 'system')
    setThemePreference(nextTheme);
  }, [theme, setThemePreference]);

  const value = useMemo(
    () => ({ theme, themePreference, toggleTheme, setTheme, setThemePreference, hasMounted }),
    [theme, themePreference, toggleTheme, setTheme, setThemePreference, hasMounted],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
