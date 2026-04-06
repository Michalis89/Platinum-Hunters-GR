import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminSupportNav from '@/app/(main)/admin/support/_components/AdminSupportNav';
import { useTicketNotificationCount } from '@/lib/hooks/useTicketNotificationCount';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    onClick,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <a
      href={href}
      onClick={event => {
        event.preventDefault();
        onClick?.();
      }}
      className={className}
    >
      {children}
    </a>
  ),
}));

jest.mock('@/lib/hooks/useTicketNotificationCount', () => ({
  __esModule: true,
  useTicketNotificationCount: jest.fn(),
}));

describe('AdminSupportNav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTicketNotificationCount as jest.Mock).mockReturnValue({ adminCount: 0 });
  });

  it('marks Tickets as active for ticket detail paths and triggers onNavigate', async () => {
    const user = userEvent.setup();
    const onNavigate = jest.fn();

    render(<AdminSupportNav pathname="/admin/support/abc123" onNavigate={onNavigate} />);

    const tickets = screen.getByRole('link', { name: /Tickets/i });
    expect(tickets.className).toContain('bg-primary/15');

    await user.click(tickets);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('marks Users as active and not Tickets on users routes', () => {
    render(<AdminSupportNav pathname="/admin/support/users/42" />);

    const users = screen.getByRole('link', { name: /Users/i });
    const tickets = screen.getByRole('link', { name: /Tickets/i });

    expect(users.className).toContain('bg-primary/15');
    expect(tickets.className).toContain('hover:bg-card');
  });

  it('renders unread badge for ticket count and caps to 99+', () => {
    (useTicketNotificationCount as jest.Mock).mockReturnValue({ adminCount: 120 });

    render(<AdminSupportNav pathname="/admin/support" />);

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('renders exact unread badge value when count is <= 99', () => {
    (useTicketNotificationCount as jest.Mock).mockReturnValue({ adminCount: 7 });

    render(<AdminSupportNav pathname="/admin/support" />);

    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('does not render unread badge when ticket count is zero', () => {
    (useTicketNotificationCount as jest.Mock).mockReturnValue({ adminCount: 0 });

    render(<AdminSupportNav pathname="/admin/support" />);

    expect(screen.queryByText('99+')).not.toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
