import { render, screen } from '@testing-library/react';
import SupportTicketDetailPage, { metadata } from '@/app/(main)/support/tickets/[id]/page';

jest.mock('@/app/components/support/SupportTicketDetail.client', () => ({
  __esModule: true,
  default: () => <div data-testid="support-ticket-detail" />,
}));

describe('SupportTicketDetailPage', () => {
  it('exports expected metadata', () => {
    expect(metadata.title).toBe('Support ticket');
    expect(metadata.description).toBe('View your support ticket updates and post replies.');
    expect(String(metadata.alternates?.canonical)).toContain('/support/tickets');
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it('renders ticket detail component', () => {
    render(<SupportTicketDetailPage />);
    expect(screen.getByTestId('support-ticket-detail')).toBeInTheDocument();
  });
});
