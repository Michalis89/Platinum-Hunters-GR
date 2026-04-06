import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

import ProfileEditLoading from '../loading';

describe('ProfileEditLoading', () => {
  it('renders skeleton placeholders', () => {
    render(<ProfileEditLoading />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders the correct number of skeleton elements', () => {
    render(<ProfileEditLoading />);
    // loading.tsx renders 6 Skeleton elements
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons).toHaveLength(6);
  });

  it('renders skeletons with expected class names', () => {
    render(<ProfileEditLoading />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons[0]).toHaveClass('h-8');
    expect(skeletons[0]).toHaveClass('w-56');
  });
});
