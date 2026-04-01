import { Plus, Swords, UserPlus } from 'lucide-react';
import { redirect } from 'next/navigation';
import type { CSSProperties } from 'react';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import type { CampaignWithRole } from '@/lib/dnd/types';
import { getUserSettings } from '@/lib/settings';
import { listCampaignsForUser } from '@/lib/dnd/queries/campaigns';
import { PageContainer } from '@/app/components/layout';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty';
import { CampaignCard } from '@/components/dnd/CampaignCard';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'My Campaigns',
  description: 'Manage your D&D campaigns',
  path: '/dnd/campaigns',
  noindex: true,
});

export default async function CampaignsPage() {
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

  const isDM = settings.dnd_role === 'dm';

  let campaigns: CampaignWithRole[] = [];
  let loadError: string | null = null;

  try {
    campaigns = await listCampaignsForUser(supabase, session.user.id);
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Failed to load campaigns.';
  }

  return (
    <main className="pb-10 pt-6 md:pb-16 md:pt-8">
      <PageContainer size="lg" className="space-y-6">
        <PageHeader
          title="My Campaigns"
          description={isDM ? 'Create and manage your adventures.' : "Campaigns you've joined."}
          eyebrow="D&D"
          align="left"
          actions={
            isDM ? (
              <Button href="/dnd/campaigns/new" icon={<Plus className="h-4 w-4" />}>
                New Campaign
              </Button>
            ) : undefined
          }
        />

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to load campaigns</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        {!isDM ? (
          <Alert>
            <AlertTitle>Need to join another table?</AlertTitle>
            <AlertDescription>Ask your DM for an invite link to join their campaign.</AlertDescription>
          </Alert>
        ) : null}

        {campaigns.length === 0 ? (
          <EmptyState
            icon={isDM ? <Swords className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            title={isDM ? 'No campaigns yet' : 'No joined campaigns yet'}
            description={
              isDM
                ? 'Create your first campaign to start planning sessions and inviting players.'
                : 'Ask your DM for an invite link and join from your campaigns page.'
            }
            action={
              isDM ? (
                <Button href="/dnd/campaigns/new" icon={<Plus className="h-4 w-4" />}>
                  Create Campaign
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {campaigns.map((campaign, index) => (
              <div key={campaign.id} className="animate-fade-in-up" style={{ '--stagger': index } as CSSProperties}>
                <CampaignCard campaign={campaign} />
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </main>
  );
}
