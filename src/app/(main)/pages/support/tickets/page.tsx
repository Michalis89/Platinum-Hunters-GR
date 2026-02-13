import SupportTicketsList from '@/app/components/support/SupportTicketsList.client';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import { requireServerAuth } from '@/lib/auth/requireServerAuth';

export const metadata = buildMetadata({
  title: 'Τα tickets μου | Hobbistas',
  description: 'Δες την πορεία των αιτημάτων υποστήριξης σου στον Hobbistas.',
  path: '/pages/support/tickets',
});

export default async function SupportTicketsPage() {
  await requireServerAuth('/pages/support/tickets');

  return (
    <main className="">
      <SupportTicketsList />
    </main>
  );
}
