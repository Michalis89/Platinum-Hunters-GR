import type { ReactNode } from 'react';
import { notFound, redirect } from 'next/navigation';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getCampaignRole } from '@/lib/dnd/access';

type Props = {
  campaignId: string;
  children: ReactNode;
};

export async function MemberGuard({ campaignId, children }: Readonly<Props>) {
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  const role = await getCampaignRole(supabase, campaignId, session.user.id);

  if (!role) {
    notFound();
  }

  return <>{children}</>;
}
