import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Navbar from '../Navbar';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next/link', () => {
  const MockLink = React.forwardRef(
    (
      { href, children }: { href: string; children: React.ReactNode },
      ref: React.Ref<HTMLAnchorElement>,
    ) => (
      <a href={href} data-testid={`nav-link-${href}`} ref={ref}>
        {children}
      </a>
    ),
  );
  MockLink.displayName = 'NextLinkMock';
  return MockLink;
});

describe('Navbar Component', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('renders navbar correctly', () => {
    render(<Navbar />);

    expect(screen.getByText('Platinum Hunters')).toBeInTheDocument();
    expect(screen.getByTestId('nav-link-/pages/guide')).toBeInTheDocument();
    expect(screen.getByTestId('nav-link-/pages/reviews')).toBeInTheDocument();
    expect(screen.getByTestId('nav-link-/pages/news')).toBeInTheDocument();
    expect(screen.getByTestId('nav-link-/pages/contact')).toBeInTheDocument();
  });

  it('mobile menu opens and closes correctly', async () => {
    render(<Navbar />);

    const menuButton = screen.getByRole('button');
    expect(menuButton).toBeInTheDocument();

    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();

    fireEvent.click(menuButton);

    const mobileMenu = await screen.findByTestId('mobile-menu');

    await waitFor(() => expect(mobileMenu).toBeVisible());

    fireEvent.click(menuButton);

    await waitFor(() => expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument());
  });

  it('navigates correctly when clicking a menu link', () => {
    render(<Navbar />);

    const guideLink = screen.getByTestId('nav-link-/pages/guide');
    fireEvent.click(guideLink);

    expect(guideLink).toHaveAttribute('href', '/pages/guide');
  });

  it('hides the scraper link when not in development mode', () => {
    process.env = { ...originalEnv, NODE_ENV: 'production' };
    render(<Navbar />);

    expect(screen.queryByTestId('nav-link-/pages/scraper')).not.toBeInTheDocument();
  });

  it('shows the scraper link only in development mode', () => {
    process.env = { ...originalEnv, NODE_ENV: 'development' };
    render(<Navbar />);

    expect(screen.getByTestId('nav-link-/pages/scraper')).toBeInTheDocument();
  });
});
