import { render, screen } from '@testing-library/react';
import AdminSupportDataCurationPage, {
  metadata,
} from '@/app/(main)/admin/support/data-curation/page';

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

jest.mock('@/app/components/support/AdminMediaCurationTable.client', () => ({
  __esModule: true,
  default: () => <div data-testid="admin-media-curation-table" />,
}));

describe('AdminSupportDataCurationPage', () => {
  it('exports expected metadata', () => {
    expect(metadata).toMatchObject({
      title: 'Data Curation | Admin Support',
      description: 'Media data curation for admins.',
    });
  });

  it('renders curation table inside full-width page container', () => {
    render(<AdminSupportDataCurationPage />);

    expect(screen.getByTestId('page-container')).toHaveAttribute('data-size', 'full');
    expect(screen.getByTestId('page-container')).toHaveAttribute('data-class', 'py-4 md:py-6');
    expect(screen.getByTestId('admin-media-curation-table')).toBeInTheDocument();
  });
});
