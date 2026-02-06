import HomeDashboardPageClient from '@/app/components/home/HomeDashboardPageClient';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Dashboard | Hobbistas',
  description: 'Προσωπικό dashboard για το backlog, την πρόοδο και τις προτάσεις σου.',
  path: '/dashboard',
  noindex: true,
});

export default function DashboardPage() {
  return <HomeDashboardPageClient />;
}

