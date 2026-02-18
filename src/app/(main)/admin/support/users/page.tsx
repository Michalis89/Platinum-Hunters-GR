import { PageContainer } from '@/app/components/layout/PageContainer';
import AdminUsersManagementTable from '@/app/components/support/AdminUsersManagementTable.client';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'User Management | Admin Support',
  description: 'Manage user profiles and roles.',
  path: '/admin/support/users',
});

export default function AdminSupportUsersPage() {
  return (
    <PageContainer size="full" className="py-4 md:py-6">
      <AdminUsersManagementTable />
    </PageContainer>
  );
}
