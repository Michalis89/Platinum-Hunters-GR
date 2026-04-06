import { Suspense } from 'react';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import { DashboardContentSkeleton, DashboardData } from './dashboardPageContent';

export const revalidate = 300;

export const metadata = buildMetadata({
  title: 'Dashboard | Hobbistas',
  description:
    'Personal dashboard for managing your backlog, tracking progress, and exploring tailored suggestions.',
  path: '/dashboard',
  noindex: true,
});

export default function DashboardPage() {
  return (
    <div className="w-full px-2 pb-10 pt-2 md:px-4 md:pb-14 md:pt-4">
      <h1 className="sr-only">Dashboard</h1>
      <Suspense fallback={<DashboardContentSkeleton />}>
        <DashboardData />
      </Suspense>
    </div>
  );
}
