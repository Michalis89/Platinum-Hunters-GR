'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { SITE_LOCALE } from '@/config/site';
import { useBrowserLocale, type BrowserLocale } from '@/hooks/useBrowserLocale';

type LocaleContextValue = {
  locale: BrowserLocale;
  hasProvider: boolean;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: SITE_LOCALE,
  hasProvider: false,
});

export function LocaleProvider({ children }: Readonly<{ children: ReactNode }>) {
  const locale = useBrowserLocale();

  return (
    <LocaleContext.Provider value={{ locale, hasProvider: true }}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): BrowserLocale {
  const value = useContext(LocaleContext);

  if (!value.hasProvider) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }

  return value.locale;
}
