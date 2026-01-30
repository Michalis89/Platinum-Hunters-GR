import AdminSupportInbox from '@/app/components/support/AdminSupportInbox.client';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Εισερχόμενα Υποστήριξης | Hobbistas',
  description: 'Διαχείριση αιτημάτων υποστήριξης για διαχειριστές.',
  path: '/admin/support',
});

export default function AdminSupportPage() {
  return <AdminSupportInbox />;
}
