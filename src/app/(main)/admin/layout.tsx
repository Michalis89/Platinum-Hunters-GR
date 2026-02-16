import type { ReactNode } from 'react';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Admin',
  description: 'Administrative controls for Hobbistas operations.',
  path: '/admin',
  noindex: true,
});

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
