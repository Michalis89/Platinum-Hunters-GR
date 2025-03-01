import { render, screen } from '@testing-library/react';
import TrophyStats from '../TrophyStats';

describe('TrophyStats Component', () => {
  const mockTrophies = {
    platinum: 1,
    gold: 3,
    silver: 10,
    bronze: 20,
  };

  it('renders the correct trophy counts', () => {
    render(<TrophyStats trophies={mockTrophies} />);

    expect(screen.getByText(mockTrophies.platinum.toString())).toBeInTheDocument();
    expect(screen.getByText(mockTrophies.gold.toString())).toBeInTheDocument();
    expect(screen.getByText(mockTrophies.silver.toString())).toBeInTheDocument();
    expect(screen.getByText(mockTrophies.bronze.toString())).toBeInTheDocument();
  });

  it('renders all trophy icons', () => {
    render(<TrophyStats trophies={mockTrophies} />);

    const trophyIcons = screen.getAllByTestId('trophy-icon');
    expect(trophyIcons.length).toBe(4); // ✅ Τώρα θα περάσει το test!
  });
});
