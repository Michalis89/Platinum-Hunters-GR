import { render, screen } from '@testing-library/react';
import ArticleDetailLoading from '@/app/(main)/articles/[slug]/loading';

jest.mock('@/components/ui/skeleton', () => ({
  __esModule: true,
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" data-class={className} />
  ),
}));

describe('ArticleDetailLoading', () => {
  it('renders six skeleton placeholders', () => {
    render(<ArticleDetailLoading />);

    expect(screen.getAllByTestId('skeleton')).toHaveLength(6);
  });
});
