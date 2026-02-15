import { PageContainer } from '@/app/components/layout/PageContainer';
import AdminMediaCurationTable from '@/app/components/support/AdminMediaCurationTable.client';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Data Curation | Admin Support',
  description: 'Επιμέλεια δεδομένων media για διαχειριστές.',
  path: '/admin/support/data-curation',
});

export default function AdminSupportDataCurationPage() {
  return (
    <PageContainer size="full" className="py-4 md:py-6">
      <AdminMediaCurationTable />
    </PageContainer>
  );
}
