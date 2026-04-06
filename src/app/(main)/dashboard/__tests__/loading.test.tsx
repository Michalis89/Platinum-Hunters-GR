import { render, screen } from '@testing-library/react';
import DashboardLoading from '@/app/(main)/dashboard/loading';

jest.mock('@/components/ui/skeleton', () => ({
  __esModule: true,
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" data-class={className} />
  ),
}));

describe('DashboardLoading', () => {
  it('renders dashboard loading skeleton placeholders', () => {
    render(<DashboardLoading />);

    expect(screen.getAllByTestId('skeleton')).toHaveLength(6);
  });
});
