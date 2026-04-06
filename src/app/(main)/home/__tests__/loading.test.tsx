import { render, screen } from '@testing-library/react';
import HomeLoading from '@/app/(main)/home/loading';

jest.mock('@/components/ui/skeleton', () => ({
  __esModule: true,
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" data-class={className} />
  ),
}));

describe('HomeLoading', () => {
  it('renders home skeleton placeholders', () => {
    render(<HomeLoading />);

    expect(screen.getAllByTestId('skeleton')).toHaveLength(5);
  });
});
