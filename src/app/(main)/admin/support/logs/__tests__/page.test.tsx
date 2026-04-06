import { render, screen } from '@testing-library/react';
import AdminSupportLogsPage, { metadata } from '@/app/(main)/admin/support/logs/page';

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

jest.mock('@/app/components/support/AdminApplicationLogsPane.client', () => ({
  __esModule: true,
  default: () => <div data-testid="admin-application-logs-pane" />,
}));

describe('AdminSupportLogsPage', () => {
  it('exports expected metadata', () => {
    expect(metadata).toMatchObject({
      title: 'Application Logs | Admin Support',
      description: 'Admin visibility for application and API logs.',
    });
  });

  it('renders logs pane inside full-width page container', () => {
    render(<AdminSupportLogsPage />);

    expect(screen.getByTestId('page-container')).toHaveAttribute('data-size', 'full');
    expect(screen.getByTestId('page-container')).toHaveAttribute('data-class', 'py-4 md:py-6');
    expect(screen.getByTestId('admin-application-logs-pane')).toBeInTheDocument();
  });
});
