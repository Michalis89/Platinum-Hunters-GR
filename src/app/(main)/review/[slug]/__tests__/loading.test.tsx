import { render, screen } from '@testing-library/react';
import ReviewDetailLoading from '@/app/(main)/review/[slug]/loading';

jest.mock('@/components/ui/skeleton', () => ({
  __esModule: true,
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" data-class={className} />
  ),
}));

describe('ReviewDetailLoading', () => {
  it('renders six skeleton placeholders', () => {
    render(<ReviewDetailLoading />);

    expect(screen.getAllByTestId('skeleton')).toHaveLength(6);
  });
});
