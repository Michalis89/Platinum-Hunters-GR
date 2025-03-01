import { render, screen } from '@testing-library/react';
import GamePlatforms from '../GamePlatforms';

describe('GamePlatforms Component', () => {
  it('renders platforms correctly when provided', () => {
    render(<GamePlatforms platforms={['PS5', 'Xbox Series X', 'PC']} />);

    expect(screen.getByText('Platforms:')).toBeInTheDocument();
    expect(screen.getByText('PS5, Xbox Series X, PC')).toBeInTheDocument();
  });

  it('does not render anything when platforms is undefined', () => {
    render(<GamePlatforms platforms={undefined} />);

    expect(screen.queryByText('Platforms:')).not.toBeInTheDocument();
  });

  it('does not render anything when platforms is an empty array', () => {
    render(<GamePlatforms platforms={[]} />);

    expect(screen.queryByText('Platforms:')).not.toBeInTheDocument();
  });
});
