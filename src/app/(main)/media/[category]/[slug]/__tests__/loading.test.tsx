import { render, screen } from '@testing-library/react';
import MediaDetailLoading from '@/app/(main)/media/[category]/[slug]/loading';

jest.mock('@/components/ui/skeleton', () => ({
  __esModule: true,
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" data-class={className} />
  ),
}));

describe('MediaDetailLoading', () => {
  it('renders expected skeleton blocks', () => {
    render(<MediaDetailLoading />);
    expect(screen.getAllByTestId('skeleton')).toHaveLength(6);
  });
});
