import HomeGuestPageClient from '@/app/components/home/HomeGuestPageClient';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import { redirect } from 'next/navigation';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

export const metadata = buildMetadata({
  title: 'Your Hobby Hub',
  description:
    'Organize your backlog, track your progress, and keep all your hobbies in one place.',
  path: '/',
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
