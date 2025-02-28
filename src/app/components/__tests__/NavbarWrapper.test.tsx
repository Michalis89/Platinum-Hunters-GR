import { render, screen } from '@testing-library/react';
import NavbarWrapper from '../NavbarWrapper';
import { usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('../Navbar', () => {
  const MockNavbar = () => <div data-testid="navbar" />;
  MockNavbar.displayName = 'MockNavbar';
  return MockNavbar;
});

describe('NavbarWrapper', () => {
  it('renders Navbar when not on home page', () => {
    (usePathname as jest.Mock).mockReturnValue('/guide');

    render(<NavbarWrapper />);

    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  it('does not render Navbar on home page', () => {
    (usePathname as jest.Mock).mockReturnValue('/');

    render(<NavbarWrapper />);

    expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
  });
});
