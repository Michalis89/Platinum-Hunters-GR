import { render, screen } from '@testing-library/react';
import AdminSupportUsersPage, { metadata } from '@/app/(main)/admin/support/users/page';

jest.mock('@/app/components/layout/PageContainer', () => ({
  __esModule: true,
  PageContainer: ({
    children,
    size,
    className,
  }: {
    children: React.ReactNode;
    size?: string;
    className?: string;
  }) => (
    <div data-testid="page-container" data-size={size} data-class={className}>
      {children}
    </div>
  ),
}));

jest.mock('@/app/components/support/AdminUsersManagementTable.client', () => ({
  __esModule: true,
  default: () => <div data-testid="admin-users-management-table" />,
}));

describe('AdminSupportUsersPage', () => {
  it('exports expected metadata', () => {
    expect(metadata).toMatchObject({
      title: 'User Management | Admin Support',
      description: 'Manage user profiles and roles.',
    });
  });

  it('renders users table inside full-width page container', () => {
    render(<AdminSupportUsersPage />);

    expect(screen.getByTestId('page-container')).toHaveAttribute('data-size', 'full');
    expect(screen.getByTestId('page-container')).toHaveAttribute('data-class', 'py-4 md:py-6');
    expect(screen.getByTestId('admin-users-management-table')).toBeInTheDocument();
  });
});
