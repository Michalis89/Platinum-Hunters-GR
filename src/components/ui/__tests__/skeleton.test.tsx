import React from 'react';
import { render, screen } from '@testing-library/react';

import { Skeleton } from '@/components/ui/skeleton';

describe('components/ui/skeleton', () => {
  it('renders with the default skeleton classes', () => {
    render(<Skeleton data-testid="skeleton" />);

    const skeleton = screen.getByTestId('skeleton');

    expect(skeleton).toBeInTheDocument();
    expect(skeleton.className).toContain('animate-pulse');
    expect(skeleton.className).toContain('rounded-md');
    expect(skeleton.className).toContain('bg-primary/10');
  });

  it('merges custom classes and forwards html attributes', () => {
    render(
      <Skeleton
        data-testid="skeleton"
        className="custom-skeleton h-10 w-20"
        aria-label="Loading block"
      />,
    );

    const skeleton = screen.getByTestId('skeleton');

    expect(skeleton.className).toContain('custom-skeleton');
    expect(skeleton.className).toContain('h-10');
    expect(skeleton.className).toContain('w-20');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading block');
  });
});
