import { render, screen } from '@testing-library/react';
import AdminSupportLayout from '@/app/(main)/admin/support/layout';

jest.mock('@/app/(main)/admin/support/_components/AdminSupportShell.client', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-support-shell">{children}</div>
  ),
}));

describe('AdminSupportLayout', () => {
  it('wraps children with AdminSupportShell', () => {
    render(
      <AdminSupportLayout>
        <div>Support content</div>
      </AdminSupportLayout>,
    );

    expect(screen.getByTestId('admin-support-shell')).toBeInTheDocument();
    expect(screen.getByText('Support content')).toBeInTheDocument();
  });
});
