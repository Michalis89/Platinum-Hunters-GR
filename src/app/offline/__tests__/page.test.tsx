import { render, screen } from '@testing-library/react';
import OfflinePage from '@/app/offline/page';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  __esModule: true,
  Button: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
    variant?: string;
  }) => (asChild ? <>{children}</> : <button>{children}</button>),
}));

describe('OfflinePage', () => {
  beforeEach(() => {
    render(<OfflinePage />);
  });

  it('renders the main heading', () => {
    expect(screen.getByRole('heading', { name: 'No internet connection' })).toBeInTheDocument();
  });

  it('renders the Offline label', () => {
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('renders the descriptive message', () => {
    expect(screen.getByText(/Some pages may still work from cache/)).toBeInTheDocument();
  });

  it('renders a link to /home labeled "Go to Home"', () => {
    const link = screen.getByRole('link', { name: 'Go to Home' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/home');
  });

  it('renders a link to / labeled "Retry"', () => {
    const link = screen.getByRole('link', { name: 'Retry' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders the WifiOff icon', () => {
    expect(document.querySelector('[data-icon="WifiOff"]')).toBeInTheDocument();
  });
});
