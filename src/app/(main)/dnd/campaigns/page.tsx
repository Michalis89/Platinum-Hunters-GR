import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getUserSettings } from '@/lib/settings';
import { PageContainer } from '@/app/components/layout';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

  return (
    <main className="pb-10 pt-6 md:pb-16 md:pt-8">
      <PageContainer size="lg" className="space-y-6">
        <PageHeader
          title="My Campaigns"
          description={isDM ? 'Manage your campaigns' : "Campaigns you're part of"}
          eyebrow="D&D"
          align="left"
          actions={
            isDM ? (
              <Button disabled>
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            ) : undefined
          }
        />
        <Card>
          <CardHeader>
            <CardTitle>Campaigns</CardTitle>
            <CardDescription>No campaigns yet</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {isDM
                ? 'Create your first campaign to start managing sessions and sharing tools with players.'
                : "You haven't joined any campaigns yet. Ask your DM for an invitation."}
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    </main>
  );
}
