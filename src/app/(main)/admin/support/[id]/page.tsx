import AdminSupportTicketDetail from '@/app/components/support/AdminSupportTicketDetail.client';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Support Ticket | Management',
  description: 'Manage support tickets in Hobbistas.',
  path: '/admin/support',
});

export default function AdminSupportTicketPage() {
  return <AdminSupportTicketDetail />;
}
