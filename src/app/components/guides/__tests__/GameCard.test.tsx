import { render, screen } from '@testing-library/react';
import GameCard from '../GameCard';
import { Game } from '@/types/interfaces';

jest.mock('next/image', () => {
  const MockImage = (props: { alt: string }) => <div data-testid="game-image" {...props} />;
  MockImage.displayName = 'NextImageMock';
  return MockImage;
});

jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="game-link">
      {children}
    </a>
  );
  MockLink.displayName = 'NextLinkMock';
  return MockLink;
});

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('GameCard Component', () => {
  const mockGame: Game = {
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
  };

  test('renders correctly', () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText(mockGame.title)).toBeInTheDocument();
    expect(screen.getByText(mockGame.platform)).toBeInTheDocument();
    expect(screen.getByTestId('game-image')).toHaveAttribute('src', mockGame.game_image);
  });

  test('renders correct trophy counts', () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText(mockGame.trophies.Platinum)).toBeInTheDocument();
    expect(screen.getByText(mockGame.trophies.Gold)).toBeInTheDocument();
    expect(screen.getByText(mockGame.trophies.Silver)).toBeInTheDocument();
    expect(screen.getByText(mockGame.trophies.Bronze)).toBeInTheDocument();
  });

  test('generates correct link URL', () => {
    render(<GameCard game={mockGame} />);
    const expectedSlug = encodeURIComponent(
      mockGame.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    );
    const link = screen.getByTestId('game-link');
    expect(link).toHaveAttribute('href', `/pages/guide/${expectedSlug}`);
  });

  test('renders total points correctly', () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText(`⭐ Σύνολο Πόντων: ${mockGame.totalPoints}`)).toBeInTheDocument();
  });
});
