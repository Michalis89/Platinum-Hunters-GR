import HomeGuestPageClient from '@/app/components/home/HomeGuestPageClient';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Το No1 Hobby Hub',
  description:
    'Οργάνωσε το backlog σου, παρακολούθησε την πρόοδό σου και ανακάλυψε νέα χόμπι με τον Hobbistas.',
  path: '/home',
});

export default function HomePage() {
  return <HomeGuestPageClient />;
}

