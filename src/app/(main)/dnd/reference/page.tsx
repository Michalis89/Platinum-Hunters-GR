import { redirect } from 'next/navigation';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getUserSettings } from '@/lib/settings';
import { PageContainer } from '@/app/components/layout';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ReferenceLookupPanel } from '@/components/dnd/ReferenceLookupPanel';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'D&D Reference',
  description: 'SRD content - spells, monsters, items and conditions',
  path: '/dnd/reference',
  noindex: true,
});

export default async function DndReferencePage() {
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
          title="D&D Reference"
          description="SRD content - spells, monsters, items and conditions"
          eyebrow="D&D"
          align="left"
        />

        <ReferenceLookupPanel />

        <Alert>
          <AlertTitle>SRD Content Notice</AlertTitle>
          <AlertDescription>
            Content from the Systems Reference Document (SRD) under Creative Commons.
          </AlertDescription>
        </Alert>
      </PageContainer>
    </main>
  );
}
