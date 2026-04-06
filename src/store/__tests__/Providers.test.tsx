import { render, screen } from '@testing-library/react';
import Providers from '@/store/Providers';
import { store } from '@/store/store';
import { swrConfig } from '@/lib/swr/config';

jest.mock('@/store/store', () => ({
  store: {
    dispatch: jest.fn(),
    getState: jest.fn(() => ({})),
    subscribe: jest.fn(),
  },
}));

const providerMock = jest.fn(({ children }: { children: React.ReactNode }) => (
  <div data-testid="redux-provider">{children}</div>
));
const swrConfigMock = jest.fn(({ children }: { children: React.ReactNode }) => (
  <div data-testid="swr-config">{children}</div>
));
const themeProviderMock = jest.fn(({ children }: { children: React.ReactNode }) => (
  <div data-testid="theme-provider">{children}</div>
));

jest.mock('react-redux', () => ({
  Provider: (props: { children: React.ReactNode; store: unknown }) => providerMock(props),
}));

jest.mock('swr', () => ({
  SWRConfig: (props: { children: React.ReactNode; value: unknown }) => swrConfigMock(props),
}));

jest.mock('@/context/ThemeContext', () => ({
  ThemeProvider: (props: {
    children: React.ReactNode;
    initialTheme?: 'dark' | 'light';
    initialPreference?: 'system' | 'dark' | 'light';
  }) => themeProviderMock(props),
}));

jest.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

describe('store Providers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('composes provider tree and renders children with toaster', () => {
    render(
      <Providers initialTheme="dark" initialPreference="system">
        <div data-testid="child">hello</div>
      </Providers>,
    );

    expect(screen.getByTestId('redux-provider')).toBeInTheDocument();
    expect(screen.getByTestId('swr-config')).toBeInTheDocument();
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('hello');
    expect(screen.getByTestId('toaster')).toBeInTheDocument();

    expect(providerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        store,
      }),
    );
    expect(swrConfigMock).toHaveBeenCalledWith(
      expect.objectContaining({
        value: swrConfig,
      }),
    );
    expect(themeProviderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        initialTheme: 'dark',
        initialPreference: 'system',
      }),
    );
  });

  it('passes undefined theme props when not provided', () => {
    render(
      <Providers>
        <div>content</div>
      </Providers>,
    );

    expect(themeProviderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        initialTheme: undefined,
        initialPreference: undefined,
      }),
    );
  });
});
