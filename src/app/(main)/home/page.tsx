import HomeGuestPageClient from '@/app/components/home/HomeGuestPageClient';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import { redirect } from 'next/navigation';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

export const metadata = buildMetadata({
  title: 'Το No1 Hobby Hub',
  description:
    'Οργάνωσε το backlog σου, παρακολούθησε την πρόοδό σου και ανακάλυψε νέα χόμπι με τον Hobbistas.',
  path: '/home',
});

export default async function HomePage() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return <HomeGuestPageClient />;
}
