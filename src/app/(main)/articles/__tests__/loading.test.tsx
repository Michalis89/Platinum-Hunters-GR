import { render, screen } from '@testing-library/react';
import ArticlesLoading from '@/app/(main)/articles/loading';

jest.mock('@/components/ui/skeleton', () => ({
  __esModule: true,
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" data-class={className} />
  ),
}));

describe('ArticlesLoading', () => {
  it('renders heading and card placeholders', () => {
    render(<ArticlesLoading />);

    expect(screen.getAllByTestId('skeleton')).toHaveLength(4);
  });
});
