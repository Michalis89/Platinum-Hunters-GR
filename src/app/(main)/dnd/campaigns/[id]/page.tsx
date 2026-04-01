import { notFound, redirect } from 'next/navigation';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getUserSettings } from '@/lib/settings';
import { getCampaignRole } from '@/lib/dnd/access';
import { getCampaign } from '@/lib/dnd/queries/campaigns';
import { PageContainer } from '@/app/components/layout';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { CampaignDashboardTabs } from '@/components/dnd/CampaignDashboardTabs';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
};

export default async function CampaignDashboardPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const requestedTab =
    typeof resolvedSearchParams.tab === 'string' ? resolvedSearchParams.tab : undefined;

  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  const settings = await getUserSettings(session.user.id, { supabase });
  if (!settings.dnd_enabled) {
    redirect('/settings');
  }

  const [campaign, role] = await Promise.all([
    getCampaign(supabase, id),
    getCampaignRole(supabase, id, session.user.id),
  ]);

  if (!campaign || !role) {
    notFound();
  }

  const isDm = role === 'dm' || role === 'co_dm';

  return (
    <main className="pb-10 pt-6 md:pb-16 md:pt-8">
      <PageContainer size="lg" className="space-y-6">
        <PageHeader
          title={campaign.name}
          description="Campaign workspace"
          eyebrow="D&D"
          align="left"
          badges={
            <>
              <Badge variant="secondary">{campaign.system ?? 'System not set'}</Badge>
              <Badge
                variant={isDm ? 'default' : 'secondary'}
                className={
                  isDm
                    ? 'border-primary/30 bg-primary/15 text-primary'
                    : 'border-secondary/30 bg-secondary/80 text-secondary-foreground'
                }
              >
                {isDm ? 'DM' : 'Player'}
              </Badge>
            </>
          }
        />

        <CampaignDashboardTabs campaignId={id} role={role} initialTab={requestedTab} />
      </PageContainer>
    </main>
  );
}
