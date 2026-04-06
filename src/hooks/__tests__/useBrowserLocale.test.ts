import { renderHook } from '@testing-library/react';
import { useBrowserLocale } from '@/hooks/useBrowserLocale';
import { SITE_LOCALE } from '@/config/site';

describe('useBrowserLocale', () => {
  function setNavigatorLocales(languages: string[] | undefined, language: string) {
    Object.defineProperty(window.navigator, 'languages', {
      configurable: true,
      value: languages,
    });
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      value: language,
    });
  }

  it('prefers first locale with region tag when supported', () => {
    setNavigatorLocales(['en', 'el-GR', 'fr-FR'], 'en-US');
    const supportedSpy = jest
      .spyOn(Intl.DateTimeFormat, 'supportedLocalesOf')
      .mockReturnValue(['el-GR']);

    const { result } = renderHook(() => useBrowserLocale());
    expect(result.current).toBe('el-GR');

    supportedSpy.mockRestore();
  });

  it('falls back to navigator.language and keeps default locale when unsupported', () => {
    setNavigatorLocales(undefined, 'xx-YY');
    const supportedSpy = jest.spyOn(Intl.DateTimeFormat, 'supportedLocalesOf').mockReturnValue([]);

    const { result } = renderHook(() => useBrowserLocale());
    expect(result.current).toBe(SITE_LOCALE);

    supportedSpy.mockRestore();
  });

  it('uses first language when no region tag exists and keeps same locale value', () => {
    setNavigatorLocales(['en-US', 'en'], 'en-US');
    const supportedSpy = jest
      .spyOn(Intl.DateTimeFormat, 'supportedLocalesOf')
      .mockReturnValue(['en-US']);

    const { result } = renderHook(() => useBrowserLocale());
    expect(result.current).toBe('en-US');

    supportedSpy.mockRestore();
  });

  it('falls back to the first language when no region-tagged locale exists', () => {
    setNavigatorLocales(['en', 'fr'], 'en');
    const supportedSpy = jest
      .spyOn(Intl.DateTimeFormat, 'supportedLocalesOf')
      .mockReturnValue(['en']);

    const { result } = renderHook(() => useBrowserLocale());
    expect(result.current).toBe('en');

    supportedSpy.mockRestore();
  });
});
