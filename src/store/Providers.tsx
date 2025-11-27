'use client';

import { store } from './store';
import { Provider } from 'react-redux';
import AuthInit from '@/app/components/AuthInit';

interface Props {
  readonly children: React.ReactNode;
}

export default function Providers({ children }: Props) {
  return (
    <Provider store={store}>
      <AuthInit />
      {children}
    </Provider>
  );
}
