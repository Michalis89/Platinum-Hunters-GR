import SupportTicketsList from '@/app/components/support/SupportTicketsList.client';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Τα tickets μου | Hobbistas',
  description: 'Δες την πορεία των αιτημάτων υποστήριξης σου στον Hobbistas.',
  path: '/pages/support/tickets',
});

export default function SupportTicketsPage() {
  return (
    <main className="apple-page-background">
      <SupportTicketsList />
    </main>
  );
}
