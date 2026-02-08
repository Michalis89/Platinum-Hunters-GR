import SupportTicketDetail from '@/app/components/support/SupportTicketDetail.client';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Ticket υποστήριξης | Hobbistas',
  description: 'Δες το ticket υποστήριξης σου και πρόσθεσε απαντήσεις.',
  path: '/pages/support/tickets',
});

export default function SupportTicketDetailPage() {
  return (
    <main className="apple-page-background">
      <SupportTicketDetail />
    </main>
  );
}
