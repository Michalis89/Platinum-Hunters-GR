import { render, screen } from '@testing-library/react';
import AdminSupportTicketPage, { metadata } from '@/app/(main)/admin/support/[id]/page';

jest.mock('@/app/components/support/AdminSupportTicketDetail.client', () => ({
  __esModule: true,
  default: () => <div data-testid="admin-support-ticket-detail" />,
}));

describe('AdminSupportTicketPage', () => {
  it('exports expected metadata', () => {
    expect(metadata).toMatchObject({
      title: 'Support Ticket | Management',
      description: 'Manage support tickets in Hobbistas.',
    });
  });

  it('renders AdminSupportTicketDetail', () => {
    render(<AdminSupportTicketPage />);

    expect(screen.getByTestId('admin-support-ticket-detail')).toBeInTheDocument();
  });
});
