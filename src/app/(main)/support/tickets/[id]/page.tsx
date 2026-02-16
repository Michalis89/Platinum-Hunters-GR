import SupportTicketDetail from '@/app/components/support/SupportTicketDetail.client';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Support ticket | Hobbistas',
  description: 'View your support ticket updates and post replies.',
  path: '/support/tickets',
  noindex: true,
});

export default function SupportTicketDetailPage() {
  return (
    <main className="">
      <SupportTicketDetail />
    </main>
  );
}
