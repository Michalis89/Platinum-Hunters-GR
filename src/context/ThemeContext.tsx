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

function setThemeCookie(theme: Theme) {
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: Theme;
}

export function ThemeProvider({ children, initialTheme = 'dark' }: ThemeProviderProps) {
  // ✅ First client render matches SSR
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    // On mount, make storage/cookie consistent with *current* theme
    // (do not flip theme immediately — avoids hydration mismatch)
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;

      if (!stored) {
        // if nothing stored, store the SSR theme so next load is consistent
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      }
    } catch {
      // ignore
    }

    try {
      document.documentElement.setAttribute('data-theme', theme);
      setThemeCookie(theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Optional: listen to system changes, but ONLY if user hasn't manually set preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored) return; // user preference exists, don't auto-switch
      } catch {
        // if storage blocked, just don't auto switch
        return;
      }

      const newTheme = e.matches ? 'dark' : 'light';
      setThemeState(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      setThemeCookie(newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}
    setThemeCookie(newTheme);
  }, []);

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
