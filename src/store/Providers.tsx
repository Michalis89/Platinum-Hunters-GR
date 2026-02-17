'use client';

import { store } from './store';
import { Provider } from 'react-redux';
import { SWRConfig } from 'swr';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from '@/components/ui/sonner';
import { swrConfig } from '@/lib/swr/config';

type Theme = 'dark' | 'light';

interface Props {
  readonly children: React.ReactNode;
  readonly initialTheme?: Theme;
}

export default function Providers({ children, initialTheme }: Props) {
  return (
    <Provider store={store}>
      <SWRConfig value={swrConfig}>
        <ThemeProvider initialTheme={initialTheme}>
          {children}
          <Toaster />
        </ThemeProvider>
      </SWRConfig>
    </Provider>
  );
}
