import { render, screen } from '@testing-library/react';
import Badge from '../Badge';

describe('Badge Component', () => {
  it('renders without crashing', () => {
    render(<Badge text="Platinum" color="#FFD700" />);
    expect(screen.getByText('Platinum')).toBeInTheDocument();
  });

  it('applies the correct background color', () => {
    render(<Badge text="Gold" color="gold" />);
    const badgeElement = screen.getByText('Gold');

    expect(badgeElement).toHaveStyle({ backgroundColor: 'gold' });
  });
});
