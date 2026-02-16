import type { ReactNode } from 'react';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Edit Profile',
  description: 'Manage your profile details and privacy settings.',
  path: '/profile/edit',
  noindex: true,
});

export default function ProfileEditLayout({ children }: { children: ReactNode }) {
  return children;
}
