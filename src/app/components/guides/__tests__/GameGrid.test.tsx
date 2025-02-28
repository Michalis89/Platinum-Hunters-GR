import { render, screen } from '@testing-library/react';
import GameGrid from '../GameGrid';
import { Game } from '@/types/interfaces';

jest.mock('../GameCard', () => jest.fn(() => <div data-testid="game-card" />));

describe('GameGrid Component', () => {
  const mockGames: Game[] = [
    {
      id: 1,
      title: 'Elden Ring',
      platform: 'PlayStation 5',
      game_image: 'https://example.com/elden-ring.jpg',
      trophies: {
        Platinum: '1',
        Gold: '4',
        Silver: '14',
        Bronze: '35',
      },
      totalPoints: 1230,
      steps: [],
    },
    {
      id: 2,
      title: 'God of War',
      platform: 'PlayStation 4',
      game_image: 'https://example.com/god-of-war.jpg',
      trophies: {
        Platinum: '1',
        Gold: '5',
        Silver: '18',
        Bronze: '22',
      },
      totalPoints: 1150,
      steps: [],
    },
  ];

  test('renders correctly', () => {
    render(<GameGrid games={mockGames} />);
    expect(screen.getAllByTestId('game-card').length).toBeGreaterThan(0);
  });

  test('renders correct number of GameCard components', () => {
    render(<GameGrid games={mockGames} />);
    expect(screen.getAllByTestId('game-card')).toHaveLength(mockGames.length);
  });

  test('renders empty grid when no games are provided', () => {
    render(<GameGrid games={[]} />);
    expect(screen.queryByTestId('game-card')).not.toBeInTheDocument();
  });
});
