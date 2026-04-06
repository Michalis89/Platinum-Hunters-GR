import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

import SettingsLoading from '@/app/(main)/settings/loading';

describe('settings/loading', () => {
  it('renders skeleton placeholders', () => {
    render(<SettingsLoading />);

    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons).toHaveLength(4);
    expect(skeletons[0]).toHaveClass('h-8');
    expect(skeletons[1]).toHaveClass('rounded-2xl');
  });
});
