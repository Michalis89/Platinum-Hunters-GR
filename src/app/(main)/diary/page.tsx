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
  title: 'Personal Diary',
  description: 'Your private journal',
  path: '/diary',
  noindex: true,
});

export default async function DiaryPage() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  const settings = await getUserSettings(session.user.id, { supabase });

  if (!settings.diary_enabled) {
    redirect('/settings');
  }

  return (
    <main className="pb-10 pt-6 md:pb-16 md:pt-8">
      <PageContainer size="lg" className="space-y-6">
        <PageHeader
          title="Personal Diary"
          description="Your private thoughts and reflections"
          eyebrow="100% Private"
          align="left"
          actions={
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          }
        />
        <Card>
          <CardHeader>
            <CardTitle>Your Journal</CardTitle>
            <CardDescription>No entries yet</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Start writing your first diary entry. Your entries are 100% private and encrypted.
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    </main>
  );
}
