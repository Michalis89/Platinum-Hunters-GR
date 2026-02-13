import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { PageContainer } from '@/app/components/layout';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getUserSettings } from '@/lib/settings';
import { Skeleton } from '@/components/ui/skeleton';
import { SettingsForm } from './SettingsForm';

export const metadata = buildMetadata({
  title: 'Application Settings',
  description: 'Fine-tune your experience, privacy, and optional social layer for Hobbistas.',
  path: '/settings',
});

function SettingsSkeleton() {
  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-3 pt-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8" />
      </div>
      <div className="space-y-3 pt-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8" />
      </div>
    </div>
  );
}

export default async function SettingsPage() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  const settings = await getUserSettings(session.user.id, { supabase });

  return (
    <main className="pb-10 pt-6 md:pb-16 md:pt-8">
      <PageContainer size="lg" className="space-y-6">
        <PageHeader
          title="Application Settings"
          description="Control your personal space, content feeds, and optional social layer."
          eyebrow="Settings"
          align="left"
        />
        <Suspense fallback={<SettingsSkeleton />}>
          <SettingsForm initialSettings={settings} />
        </Suspense>
      </PageContainer>
    </main>
  );
}
