import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import HomeDashboardContent from '@/app/components/home/HomeDashboardContent';
import { fetchUserStats, fetchContinueData } from '@/lib/dashboard/server-data';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import { PageContainer } from '@/app/components/layout';

export const metadata = buildMetadata({
  title: 'Dashboard | Hobbistas',
  description: 'Προσωπικό dashboard για το backlog, την πρόοδο και τις προτάσεις σου.',
  path: '/dashboard',
  noindex: true,
});

// Loading skeleton for dashboard content
function DashboardContentSkeleton() {
  return (
    <div className="min-h-[80vh] pb-14 pt-2 md:pb-16 md:pt-3">
      <section className="px-4 pb-8 pt-12 md:px-6 md:pb-8 md:pt-16">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-20 rounded bg-[var(--apple-tertiary-fill)]" />
            <div className="h-10 w-72 rounded bg-[color-mix(in_srgb,var(--apple-tertiary-fill)_88%,var(--apple-system-blue)_12%)]" />
            <div className="h-4 w-96 max-w-full rounded bg-[var(--apple-tertiary-fill)]" />
          </div>
        </div>
      </section>

      <section className="px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="apple-material-surface min-h-[304px] animate-pulse p-6 md:p-8">
            <div className="grid min-h-[260px] items-center gap-7 md:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
              <div className="space-y-4">
                <div className="h-4 w-24 rounded bg-[var(--apple-tertiary-fill)]" />
                <div className="h-8 w-3/4 rounded bg-[color-mix(in_srgb,var(--apple-tertiary-fill)_88%,var(--apple-system-blue)_12%)]" />
                <div className="h-4 w-1/2 rounded bg-[var(--apple-tertiary-fill)]" />
                <div className="flex gap-3 pt-4">
                  <div className="h-11 w-28 rounded-full bg-[var(--apple-tertiary-fill)]" />
                  <div className="h-11 w-44 rounded-full bg-[var(--apple-tertiary-fill)]" />
                </div>
              </div>
              <div className="aspect-[4/5] w-full rounded-2xl bg-[var(--apple-tertiary-fill)] md:w-[340px]" />
            </div>
          </div>
        </div>
      </section>

      <PageContainer size="xl">
        <div className="grid gap-3.5 md:grid-cols-4 md:gap-4">
          <div className="apple-card h-24 animate-pulse bg-[var(--apple-tertiary-fill)]" />
          <div className="apple-card h-24 animate-pulse bg-[var(--apple-tertiary-fill)]" />
          <div className="apple-card h-24 animate-pulse bg-[var(--apple-tertiary-fill)]" />
          <div className="apple-card h-24 animate-pulse bg-[var(--apple-tertiary-fill)]" />
        </div>
      </PageContainer>
    </div>
  );
}

// Server Component that fetches dashboard data
async function DashboardData() {
  const supabase = await createRouteHandlerClient();

  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/pages/auth/login');
  }

  const userId = session.user.id;
  const username = session.user.user_metadata?.username ?? 'User';
  const displayName = session.user.user_metadata?.display_name ?? null;

  // Fetch data in parallel for better performance
  const [stats, continueData] = await Promise.all([
    fetchUserStats(userId),
    fetchContinueData(userId),
  ]);

  return (
    <HomeDashboardContent
      username={username}
      displayName={displayName}
      stats={stats}
      continueData={continueData}
    />
  );
}

export default function DashboardPage() {
  return (
    <section className="apple-dashboard apple-page-background relative isolate min-h-screen text-[var(--apple-label)]">
      <h1 className="sr-only">Dashboard</h1>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--apple-system-blue)_14%,transparent)] blur-3xl" />
      </div>
      <div className="relative px-2 pb-10 pt-2 md:px-4 md:pb-14 md:pt-4">
        <div className="mx-auto max-w-[1280px]">
          <div className="apple-material-surface overflow-hidden">
            <Suspense fallback={<DashboardContentSkeleton />}>
              <DashboardData />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}

