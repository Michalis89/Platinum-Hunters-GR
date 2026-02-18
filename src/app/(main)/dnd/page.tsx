import { redirect } from 'next/navigation';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getUserSettings } from '@/lib/settings';
import { PageContainer } from '@/app/components/layout';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'D&D Tools',
  description: 'Campaign management with zero-knowledge encryption',
  path: '/dnd',
  noindex: true,
});

export default async function DndLandingPage() {
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

  return (
    <main className="pb-10 pt-6 md:pb-16 md:pt-8">
      <PageContainer size="lg" className="space-y-6">
        <PageHeader
          title="D&D Tools"
          description="Campaign management with zero-knowledge encryption"
          eyebrow="Dungeons & Dragons"
          align="left"
        />
        <Card>
          <CardHeader>
            <CardTitle>Welcome to D&D Tools</CardTitle>
            <CardDescription>
              Your Role: {settings.dnd_role === 'dm' ? 'Dungeon Master' : 'Player'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This feature uses end-to-end encryption to keep your campaign content private.
            </p>
            <p className="text-sm text-muted-foreground">
              {settings.dnd_role === 'dm'
                ? 'As a DM, you can create campaigns, manage sessions, and share tools with your players.'
                : 'As a Player, you can join campaigns and access tools shared by your DM.'}
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    </main>
  );
}
