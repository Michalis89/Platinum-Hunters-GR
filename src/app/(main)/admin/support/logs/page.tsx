import { PageContainer } from '@/app/components/layout/PageContainer';
import AdminApplicationLogsPane from '@/app/components/support/AdminApplicationLogsPane.client';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Application Logs | Admin Support',
  description: 'Admin visibility for application and API logs.',
  path: '/admin/support/logs',
});

export default function AdminSupportLogsPage() {
  return (
    <PageContainer size="full" className="py-4 md:py-6">
      <AdminApplicationLogsPane />
    </PageContainer>
  );
}
