import SupportTicketDetail from '@/app/components/support/SupportTicketDetail.client';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Ticket υποστήριξης | Hobbistas',
  description: 'Δες το ticket υποστήριξης σου και πρόσθεσε απαντήσεις.',
  path: '/support/tickets',
});

export default function SupportTicketDetailPage() {
  return (
    <main className="">
      <SupportTicketDetail />
    </main>
  );
}
