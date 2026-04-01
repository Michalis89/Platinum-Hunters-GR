import { ArrowLeft, Swords } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getUserSettings } from '@/lib/settings';
import { PageContainer } from '@/app/components/layout';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { AlreadyMemberRedirect } from '@/components/dnd/AlreadyMemberRedirect';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { JoinCampaignButton } from '@/components/dnd/JoinCampaignButton';

type PageProps = {
  params: Promise<{ token: string }>;
};

type InviteCampaignRow = {
  id: string;
  name: string;
  system: string | null;
  invite_token: string;
};

export default async function JoinCampaignPage({ params }: PageProps) {
  const { token } = await params;
  const admin = createSupabaseAdminClient() as unknown as SupabaseClient;

  const { data: campaign, error: campaignError } = await admin
    .from('campaigns')
    .select('id,name,system,invite_token')
    .eq('invite_token', token)
    .is('deleted_at', null)
    .maybeSingle<InviteCampaignRow>();

  if (campaignError || !campaign) {
    notFound();
  }

  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/auth/login?next=/dnd/join/${token}`);
  }

  const settings = await getUserSettings(session.user.id, { supabase });
  if (!settings.dnd_enabled) {
    redirect(`/settings?hint=dnd&next=/dnd/join/${token}`);
  }

  const sessionClient = supabase as unknown as SupabaseClient;
  const { data: membership, error: membershipError } = await sessionClient
    .from('campaign_members')
    .select('campaign_id')
    .eq('campaign_id', campaign.id)
    .eq('user_id', session.user.id)
    .maybeSingle<{ campaign_id: string }>();

  if (membershipError) {
    throw new Error(`Failed to verify campaign membership: ${membershipError.message}`);
  }

  if (membership) {
    return <AlreadyMemberRedirect campaignId={campaign.id} />;
  }

  return (
    <main className="pb-10 pt-6 md:pb-16 md:pt-8">
      <PageContainer size="lg" className="space-y-6">
        <PageHeader
          title="Join Campaign"
          description="Review the invite details before joining."
          eyebrow="D&D Invite"
          align="left"
        />

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-4 w-4 text-muted-foreground" />
              {campaign.name}
            </CardTitle>
            <CardDescription>{campaign.system ?? 'System not specified'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed border-border p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                You&apos;re joining as
              </p>
              <p className="mt-1 text-sm font-semibold">Player</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <JoinCampaignButton campaignId={campaign.id} token={token} />
              <Button
                href="/dnd/campaigns"
                variant="outline"
                className="w-full sm:w-auto"
                icon={<ArrowLeft className="h-4 w-4" />}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </main>
  );
}
