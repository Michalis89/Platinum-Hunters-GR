import type { ReactNode } from 'react';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Profile',
  description: 'Manage your profile and personal account details.',
  path: '/profile',
  noindex: true,
});

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
