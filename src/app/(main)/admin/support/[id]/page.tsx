import AdminSupportTicketDetail from '@/app/components/support/AdminSupportTicketDetail.client';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Ticket υποστήριξης | Διαχείριση',
  description: 'Διαχείριση ticket υποστήριξης στον Hobbistas.',
  path: '/admin/support',
});

export default function AdminSupportTicketPage() {
  return <AdminSupportTicketDetail />;
}
