'use client';

import { store } from './store';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@/context/ThemeContext';

interface Props {
  readonly children: React.ReactNode;
}

export default function Providers({ children }: Props) {
  return (
    <Provider store={store}>
      <ThemeProvider>{children}</ThemeProvider>
    </Provider>
  );
}
