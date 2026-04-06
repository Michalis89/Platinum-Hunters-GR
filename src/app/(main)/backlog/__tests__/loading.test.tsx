import { render, screen } from '@testing-library/react';
import BacklogLoading from '@/app/(main)/backlog/loading';

jest.mock('@/components/ui/skeleton', () => ({
  __esModule: true,
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" data-class={className} />
  ),
}));

describe('BacklogLoading', () => {
  it('renders expected skeleton placeholders', () => {
    render(<BacklogLoading />);

    expect(screen.getAllByTestId('skeleton')).toHaveLength(8);
  });
});
