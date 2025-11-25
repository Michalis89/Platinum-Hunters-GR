import { render, screen } from '@testing-library/react';
import Badge from '../Badge';

describe('Badge Component', () => {
  it('renders without crashing', () => {
    render(<Badge text="Platinum" color="#FFD700" />);
    expect(screen.getByText('Platinum')).toBeInTheDocument();
  });

  it('applies the correct background color class', () => {
    render(<Badge text="Green Badge" color="green" />);
    const badgeElement = screen.getByText('Green Badge');

    expect(badgeElement).toHaveClass('bg-green-600');
    expect(badgeElement).toHaveClass('text-white');
  });

  it('applies default color class for unknown colors', () => {
    render(<Badge text="Unknown" color="unknown-color" />);
    const badgeElement = screen.getByText('Unknown');

    expect(badgeElement).toHaveClass('bg-gray-600');
  });
});
