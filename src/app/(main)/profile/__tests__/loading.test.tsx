import { render, screen } from '@testing-library/react';
import ProfileLoading from '@/app/(main)/profile/loading';

jest.mock('@/components/ui/skeleton', () => ({
  __esModule: true,
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" data-class={className} />
  ),
}));

describe('ProfileLoading', () => {
  it('renders profile loading placeholders', () => {
    render(<ProfileLoading />);

    expect(screen.getAllByTestId('skeleton')).toHaveLength(6);
  });
});
