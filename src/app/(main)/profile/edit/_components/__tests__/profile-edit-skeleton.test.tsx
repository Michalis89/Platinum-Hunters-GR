import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

import { ProfileEditSkeleton } from '../profile-edit-skeleton';

describe('ProfileEditSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<ProfileEditSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders multiple skeleton elements', () => {
    render(<ProfileEditSkeleton />);
    const skeletons = screen.getAllByTestId('skeleton');
    // 2 header skeletons + 4 field skeletons + 1 large skeleton = 7+1 wrapper = 8
    expect(skeletons.length).toBeGreaterThanOrEqual(7);
  });

  it('renders a rounded-full skeleton for the avatar', () => {
    render(<ProfileEditSkeleton />);
    const skeletons = screen.getAllByTestId('skeleton');
    const avatarSkeleton = skeletons.find(s => s.className.includes('rounded-full'));
    expect(avatarSkeleton).toBeDefined();
  });

  it('renders a large skeleton for content area', () => {
    render(<ProfileEditSkeleton />);
    const skeletons = screen.getAllByTestId('skeleton');
    const largeSkeleton = skeletons.find(s => s.className.includes('h-64'));
    expect(largeSkeleton).toBeDefined();
  });
});
