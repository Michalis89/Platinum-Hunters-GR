import { render, screen } from '@testing-library/react';
import AboutLoading from '@/app/(main)/about/loading';

jest.mock('@/components/ui/skeleton', () => ({
  __esModule: true,
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" data-class={className} />
  ),
}));

describe('AboutLoading', () => {
  it('renders five skeleton placeholders', () => {
    render(<AboutLoading />);

    expect(screen.getAllByTestId('skeleton')).toHaveLength(5);
  });
});
