import { render, screen } from '@testing-library/react';
import SupportTicketsPage, { metadata } from '@/app/(main)/support/tickets/page';
import { requireServerAuth } from '@/lib/auth/requireServerAuth';

jest.mock('@/lib/auth/requireServerAuth', () => ({
  requireServerAuth: jest.fn(),
}));

jest.mock('@/app/components/support/SupportTicketsList.client', () => ({
  __esModule: true,
  default: () => <div data-testid="support-tickets-list" />,
}));

describe('SupportTicketsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports expected metadata', () => {
    expect(metadata.title).toBe('My tickets');
    expect(metadata.description).toBe('Track your support requests and their status on Hobbistas.');
    expect(String(metadata.alternates?.canonical)).toContain('/support/tickets');
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it('requires auth and renders ticket list', async () => {
    render(await SupportTicketsPage());

    expect(requireServerAuth).toHaveBeenCalledWith('/support/tickets');
    expect(screen.getByTestId('support-tickets-list')).toBeInTheDocument();
  });
});
