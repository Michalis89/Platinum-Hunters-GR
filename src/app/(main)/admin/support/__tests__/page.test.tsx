import { render, screen } from '@testing-library/react';
import AdminSupportPage, { metadata } from '@/app/(main)/admin/support/page';

jest.mock('@/app/components/support/AdminSupportTicketsPane.client', () => ({
  __esModule: true,
  default: () => <div data-testid="admin-support-tickets-pane" />,
}));

describe('AdminSupportPage', () => {
  it('exports expected metadata', () => {
    expect(metadata).toMatchObject({
      title: 'Support Inbox',
      description: 'Support request management for admins.',
    });
  });

  it('renders AdminSupportTicketsPane', () => {
    render(<AdminSupportPage />);

    expect(screen.getByTestId('admin-support-tickets-pane')).toBeInTheDocument();
  });
});
