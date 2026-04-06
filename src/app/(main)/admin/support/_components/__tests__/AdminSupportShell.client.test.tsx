import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminSupportShell from '@/app/(main)/admin/support/_components/AdminSupportShell.client';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';

const adminSupportNavMock = jest.fn(
  ({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) => (
    <div data-testid="admin-support-nav" data-pathname={pathname}>
      {onNavigate ? (
        <button type="button" onClick={onNavigate}>
          Close nav
        </button>
      ) : null}
    </div>
  ),
);

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('@/store/slices/authSlice', () => ({
  __esModule: true,
  selectIsAdminOrModerator: jest.fn(),
}));

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

jest.mock('@/app/components/layout/PageContainer', () => ({
  __esModule: true,
  PageContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-container">{children}</div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  __esModule: true,
  Button: ({
    children,
    onClick,
    href,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    href?: string;
  }) =>
    href ? (
      <a href={href} {...props}>
        {children}
      </a>
    ) : (
      <button type="button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
}));

jest.mock('@/components/ui/alert', () => ({
  __esModule: true,
  ErrorAlert: ({ message }: { message: string }) => <div>{message}</div>,
}));

jest.mock('@/components/ui/sheet', () => ({
  __esModule: true,
  Sheet: ({
    open,
    onOpenChange,
    children,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
  }) => (
    <div data-testid="sheet" data-open={String(open)}>
      <button type="button" onClick={() => onOpenChange(false)}>
        Close sheet
      </button>
      {children}
    </div>
  ),
  SheetContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-content">{children}</div>
  ),
}));

jest.mock('@/app/(main)/admin/support/_components/AdminSupportNav', () => ({
  __esModule: true,
  default: (props: { pathname: string; onNavigate?: () => void }) => adminSupportNavMock(props),
}));

describe('AdminSupportShell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/admin/support');
  });

  it('renders access denied state when user is not admin/moderator', () => {
    (useSelector as jest.Mock).mockReturnValue(false);

    render(
      <AdminSupportShell>
        <div>Child content</div>
      </AdminSupportShell>,
    );

    expect(screen.getByText('You do not have access to this page.')).toBeInTheDocument();
    expect(screen.queryByText('Admin Support')).not.toBeInTheDocument();
    expect(screen.queryByText('Child content')).not.toBeInTheDocument();
  });

  it('renders admin shell, opens mobile nav, and closes via nav callback', async () => {
    const user = userEvent.setup();
    (useSelector as jest.Mock).mockReturnValue(true);
    (usePathname as jest.Mock).mockReturnValue('/admin/support/users');

    render(
      <AdminSupportShell>
        <div>Child content</div>
      </AdminSupportShell>,
    );

    expect(screen.getByText('Admin Support')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Back to application' })).toHaveLength(2);
    expect(screen.getByTestId('sheet')).toHaveAttribute('data-open', 'false');

    const openButton = screen.getByRole('button', { name: 'Open support navigation' });
    await user.click(openButton);
    expect(screen.getByTestId('sheet')).toHaveAttribute('data-open', 'true');

    const closeNavButtons = screen.getAllByRole('button', { name: 'Close nav' });
    await user.click(closeNavButtons[0]);
    expect(screen.getByTestId('sheet')).toHaveAttribute('data-open', 'false');

    await user.click(openButton);
    const backLinks = screen.getAllByRole('link', { name: 'Back to application' });
    await user.click(backLinks[1]);
    expect(screen.getByTestId('sheet')).toHaveAttribute('data-open', 'false');

    await user.click(openButton);
    await user.click(screen.getByRole('button', { name: 'Close sheet' }));
    expect(screen.getByTestId('sheet')).toHaveAttribute('data-open', 'false');

    const navs = screen.getAllByTestId('admin-support-nav');
    expect(navs).toHaveLength(2);
    expect(adminSupportNavMock).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/admin/support/users' }),
    );
  });
});
