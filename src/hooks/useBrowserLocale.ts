'use client';

import { useSyncExternalStore } from 'react';
import { SITE_LOCALE } from '@/config/site';

export type BrowserLocale = string;

const subscribe = () => () => {};

function getClientLocale(): BrowserLocale {
  const languages = navigator.languages?.length ? [...navigator.languages] : [navigator.language];

  // Prefer the first locale with a region tag (e.g. 'el-GR' over bare 'en')
  // because region tags carry date/number formatting conventions.
  const browserLocale = languages.find(lang => lang.includes('-')) ?? languages[0];

  const isSupported = Intl.DateTimeFormat.supportedLocalesOf([browserLocale]).length > 0;
  return isSupported ? browserLocale : SITE_LOCALE;
}

export function useBrowserLocale(): BrowserLocale {
  return useSyncExternalStore(subscribe, getClientLocale, () => SITE_LOCALE);
}
