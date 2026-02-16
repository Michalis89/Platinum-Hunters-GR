import AdminSupportTicketsPane from '@/app/components/support/AdminSupportTicketsPane.client';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Support Inbox | Hobbistas',
  description: 'Support request management for admins.',
  path: '/admin/support',
});

export default function AdminSupportPage() {
  return <AdminSupportTicketsPane />;
}
