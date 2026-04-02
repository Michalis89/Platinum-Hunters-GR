'use client';

import { useEffect, useState } from 'react';
import { SITE_LOCALE } from '@/config/site';

export type BrowserLocale = string;

export function useBrowserLocale(): BrowserLocale {
  const [locale, setLocale] = useState<BrowserLocale>(SITE_LOCALE);

  useEffect(() => {
    const languages = navigator.languages?.length
      ? [...navigator.languages]
      : [navigator.language];

    // Prefer the first locale with a region tag (e.g. 'el-GR' over bare 'en')
    // because region tags carry date/number formatting conventions.
    const browserLocale = languages.find(lang => lang.includes('-')) ?? languages[0];

    const isSupported =
      Intl.DateTimeFormat.supportedLocalesOf([browserLocale]).length > 0;

    if (isSupported) {
      setLocale(currentLocale =>
        currentLocale === browserLocale ? currentLocale : browserLocale,
      );
    }
  }, []);

  return locale;
}
