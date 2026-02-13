'use client';

import { store } from './store';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from '@/components/ui/sonner';

type Theme = 'dark' | 'light';

interface Props {
  readonly children: React.ReactNode;
  readonly initialTheme?: Theme;
}

export default function Providers({ children, initialTheme }: Props) {
  return (
    <Provider store={store}>
      <ThemeProvider initialTheme={initialTheme}>
        {children}
        <Toaster />
      </ThemeProvider>
    </Provider>
  );
}
