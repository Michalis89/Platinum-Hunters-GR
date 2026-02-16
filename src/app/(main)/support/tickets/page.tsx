import SupportTicketsList from '@/app/components/support/SupportTicketsList.client';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import { requireServerAuth } from '@/lib/auth/requireServerAuth';

export const metadata = buildMetadata({
  title: 'My tickets | Hobbistas',
  description: 'Track your support requests and their status on Hobbistas.',
  path: '/support/tickets',
  noindex: true,
});

export default async function SupportTicketsPage() {
  await requireServerAuth('/support/tickets');

  return (
    <main className="">
      <SupportTicketsList />
    </main>
  );
}
