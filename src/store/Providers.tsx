'use client';

import { store } from './store';
import { Provider } from 'react-redux';

interface Props {
  readonly children: React.ReactNode;
}

export default function Providers({ children }: Props) {
  return <Provider store={store}>{children}</Provider>;
}
