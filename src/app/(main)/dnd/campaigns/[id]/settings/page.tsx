import { DMGuard } from '@/components/dnd/DMGuard';
import { CampaignSettingsPanel } from '@/components/dnd/CampaignSettingsPanel';
import { PageContainer } from '@/app/components/layout';
import { PageHeader } from '@/app/components/layout/PageHeader';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CampaignSettingsPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <DMGuard campaignId={id}>
      <main className="pb-10 pt-6 md:pb-16 md:pt-8">
        <PageContainer size="lg" className="space-y-6">
          <PageHeader
            title="Campaign Settings"
            description="Manage campaign information, invite access, members, and destructive actions."
            eyebrow="D&D"
            align="left"
          />
          <CampaignSettingsPanel campaignId={id} />
        </PageContainer>
      </main>
    </DMGuard>
  );
}
