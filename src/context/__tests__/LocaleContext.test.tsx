import { render, screen, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { LocaleProvider, useLocale } from '@/context/LocaleContext';

jest.mock('@/hooks/useBrowserLocale', () => ({
  useBrowserLocale: jest.fn(() => 'el-GR'),
}));

jest.mock('@/config/site', () => ({
  SITE_LOCALE: 'en-US',
}));

describe('LocaleContext', () => {
  describe('LocaleProvider', () => {
    it('renders children', () => {
      render(
        <LocaleProvider>
          <span data-testid="child">hello</span>
        </LocaleProvider>,
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  describe('useLocale', () => {
    it('returns the browser locale when used within LocaleProvider', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <LocaleProvider>{children}</LocaleProvider>
      );
      const { result } = renderHook(() => useLocale(), { wrapper });
      expect(result.current).toBe('el-GR');
    });

    it('throws when used outside LocaleProvider', () => {
      expect(() => renderHook(() => useLocale())).toThrow(
        'useLocale must be used within a LocaleProvider',
      );
    });
  });
});
