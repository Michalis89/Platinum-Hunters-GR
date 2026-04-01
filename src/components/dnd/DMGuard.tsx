import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getCampaignRole } from '@/lib/dnd/access';

type Props = {
  campaignId: string;
  children: ReactNode;
};

export async function DMGuard({ campaignId, children }: Readonly<Props>) {
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  const role = await getCampaignRole(supabase, campaignId, session.user.id);

  if (role !== 'dm' && role !== 'co_dm') {
    redirect(`/dnd/campaigns/${campaignId}`);
  }

  return <>{children}</>;
}
