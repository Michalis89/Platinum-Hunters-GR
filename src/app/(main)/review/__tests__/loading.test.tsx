import { render, screen } from '@testing-library/react';
import ReviewLoading from '@/app/(main)/review/loading';

jest.mock('@/components/ui/skeleton', () => ({
  __esModule: true,
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" data-class={className} />
  ),
}));

describe('review/loading', () => {
  it('renders the review loading placeholders', () => {
    render(<ReviewLoading />);

    expect(screen.getAllByTestId('skeleton')).toHaveLength(4);
  });
});
