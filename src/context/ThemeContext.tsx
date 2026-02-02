'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'hobbistas-hub-theme';
const THEME_COOKIE_NAME = 'theme';

// Set cookie that server can read
function setThemeCookie(theme: Theme) {
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: Theme;
}

export function ThemeProvider({ children, initialTheme = 'dark' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  // Sync with localStorage/system preference on mount (client-side only)
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored && (stored === 'dark' || stored === 'light')) {
      if (stored !== theme) {
        setThemeState(stored);
        document.documentElement.setAttribute('data-theme', stored);
        setThemeCookie(stored);
      }
    } else {
      // Check system preference if no stored preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme = prefersDark ? 'dark' : 'light';
      if (systemTheme !== theme) {
        setThemeState(systemTheme);
        document.documentElement.setAttribute('data-theme', systemTheme);
        setThemeCookie(systemTheme);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      // Only auto-switch if user hasn't manually set a preference
      if (!stored) {
        const newTheme = e.matches ? 'dark' : 'light';
        setThemeState(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        setThemeCookie(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    setThemeCookie(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
