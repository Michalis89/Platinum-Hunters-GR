import { redirect } from 'next/navigation';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getUserSettings } from '@/lib/settings';
import { PageContainer } from '@/app/components/layout';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'DM Dashboard',
  description: 'Dungeon Master tools',
  path: '/dnd/dm',
  noindex: true,
});

export default async function DMDashboardPage() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  const settings = await getUserSettings(session.user.id, { supabase });

  if (!settings.dnd_enabled || settings.dnd_role !== 'dm') {
    redirect('/dnd');
  }

  return (
    <main className="pb-10 pt-6 md:pb-16 md:pt-8">
      <PageContainer size="lg" className="space-y-6">
        <PageHeader
          title="DM Dashboard"
          description="Dungeon Master tools and campaign management"
          eyebrow="DM Only"
          align="left"
        />
        <Alert>
          <AlertTitle>End-to-End Encryption Setup Required</AlertTitle>
          <AlertDescription>
            Before using DM tools, you need to set up your encryption keys. This ensures your
            campaign content remains private.
          </AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>DM Tools</CardTitle>
            <CardDescription>Campaign management features</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Session notes, campaign planning, player management, and tool sharing will be
              available here.
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    </main>
  );
}
