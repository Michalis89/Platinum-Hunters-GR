import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/components/ui/breadcrumbs', () => ({
  __esModule: true,
  default: ({ items }: { items: Array<{ label: string; href?: string }> }) => (
    <nav data-testid="breadcrumbs">
      {items.map((item, i) => (
        <span key={i} data-testid="breadcrumb-item">
          {item.label}
        </span>
      ))}
    </nav>
  ),
}));

import { ProfilePageHeader } from '../profile-page-header';

describe('ProfilePageHeader', () => {
  it('renders without crashing', () => {
    const { container } = render(<ProfilePageHeader />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders breadcrumbs with correct items', () => {
    render(<ProfilePageHeader />);
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    const items = screen.getAllByTestId('breadcrumb-item');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Home');
    expect(items[1]).toHaveTextContent('Profile');
    expect(items[2]).toHaveTextContent('Edit Profile');
  });

  it('renders the hero section heading', () => {
    render(<ProfilePageHeader />);
    // "Edit Profile" appears both in breadcrumb and in h1 — check h1 specifically
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Edit Profile');
  });

  it('renders the section subtitle', () => {
    render(<ProfilePageHeader />);
    expect(screen.getByText('Account - Profile Settings')).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(<ProfilePageHeader />);
    expect(
      screen.getByText('Manage your account details, hobbies, and privacy settings.'),
    ).toBeInTheDocument();
  });
});
