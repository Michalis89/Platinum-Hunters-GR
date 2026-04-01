'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/app/components/layout';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { CampaignForm } from '@/components/dnd/CampaignForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CreateCampaignInput } from '@/lib/dnd/types';

type SettingsPayload = {
  data?: {
    dnd_enabled?: boolean;
    dnd_role?: 'dm' | 'player' | null;
  };
  error?: string;
};

type CreateCampaignResponse = {
  data?: {
    id: string;
  };
  error?: string;
};

export default function NewCampaignPage() {
  const router = useRouter();
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkRole = async () => {
      try {
        const response = await fetch('/api/settings', { cache: 'no-store' });
        const payload = (await response.json()) as SettingsPayload;

        if (!response.ok || !payload.data?.dnd_enabled || payload.data.dnd_role !== 'dm') {
          router.replace('/dnd/campaigns');
          return;
        }

        if (mounted) {
          setCheckingRole(false);
        }
      } catch {
        router.replace('/dnd/campaigns');
      }
    };

    void checkRole();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleCreateCampaign = async (data: CreateCampaignInput) => {
    const response = await fetch('/api/dnd/campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: data.name,
        system: data.system ?? undefined,
        description: data.description ?? undefined,
      }),
    });

    const payload = (await response.json()) as CreateCampaignResponse;

    if (!response.ok || !payload.data?.id) {
      throw new Error(payload.error ?? 'Failed to create campaign.');
    }

    router.push(`/dnd/campaigns/${payload.data.id}`);
  };

  if (checkingRole) {
    return (
      <main className="pb-10 pt-6 md:pb-16 md:pt-8">
        <PageContainer size="lg" className="space-y-6">
          <PageHeader title="New Campaign" description="Checking permissions..." eyebrow="D&D" align="left" />
          <Card>
            <CardHeader>
              <CardTitle>Loading</CardTitle>
              <CardDescription>Preparing your campaign form.</CardDescription>
            </CardHeader>
          </Card>
        </PageContainer>
      </main>
    );
  }

  return (
    <main className="pb-10 pt-6 md:pb-16 md:pt-8">
      <PageContainer size="lg" className="space-y-6">
        <PageHeader
          title="New Campaign"
          description="Set up your next adventure and invite your players."
          eyebrow="D&D"
          align="left"
        />

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>These details can be edited later from campaign settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <CampaignForm onSubmit={handleCreateCampaign} submitLabel="Create Campaign" />
          </CardContent>
        </Card>
      </PageContainer>
    </main>
  );
}
