'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  hasMounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'hobbistas-hub-theme';
const THEME_COOKIE_NAME = 'theme';
const THEME_TRANSITION_CLASS = 'theme-animating';
const THEME_TRANSITION_MS = 200; // Optimized for 60fps performance
let themeTransitionTimeout: number | null = null;

function setThemeCookie(theme: Theme) {
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
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
  document.documentElement.setAttribute('data-theme', theme);
  setThemeCookie(theme);
}

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: Theme;
}

export function ThemeProvider({ children, initialTheme = 'dark' }: ThemeProviderProps) {
  // Keep first client render aligned with SSR value.
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;

      if (!stored) {
        localStorage.setItem(THEME_STORAGE_KEY, initialTheme);
      }
    } catch {
      // ignore storage failures
    }

    try {
      applyThemeToDom(initialTheme);
    } catch {
      // ignore dom/cookie failures
    }
  }, [initialTheme]);

  // Follow OS theme only until user explicitly picks one.
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored) {
          return;
        }
      } catch {
        return;
      }

      const newTheme: Theme = e.matches ? 'dark' : 'light';
      setThemeState(newTheme);
      applyThemeToDom(newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      if (newTheme === theme) {
        return;
      }

      applyThemeTransitionClass();
      setThemeState(newTheme);

      window.setTimeout(() => {
        applyThemeToDom(newTheme);
      }, 0);

      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch {
        // ignore storage failures
      }
    },
    [theme],
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme, hasMounted }),
    [theme, toggleTheme, setTheme, hasMounted],
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
