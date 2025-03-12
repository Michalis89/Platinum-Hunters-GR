import { render, screen } from '@testing-library/react';
import Skeleton from '../Skeleton';

describe('Skeleton Component', () => {
  test('renders the page skeleton by default', () => {
    render(<Skeleton />);
    const skeletonElement = screen.getByTestId('skeleton');
    expect(skeletonElement).toBeInTheDocument();
  });

  test('renders the grid skeleton with the default count', () => {
    render(<Skeleton type="grid" />);
    const skeletonElements = screen.getAllByTestId('skeleton-item');
    expect(skeletonElements.length).toBe(6);
  });

  test('renders the grid skeleton with a custom count', () => {
    render(<Skeleton type="grid" count={3} />);
    const skeletonElements = screen.getAllByTestId('skeleton-item');
    expect(skeletonElements.length).toBe(3);
  });

  test('renders the card skeleton', () => {
    render(<Skeleton type="card" />);
    const skeletonElement = screen.getByTestId('skeleton');
    expect(skeletonElement).toBeInTheDocument();
  });

  test('returns null for an invalid type', () => {
    const { container } = render(<Skeleton type={'invalid' as unknown as 'page'} />);
    expect(container.firstChild).toBeNull();
  });
});
