import { render, screen } from '@testing-library/react';
import GameCard from '../GameCard';
import { ProcessedGame } from '@/types/interfaces'; // Import the correct interface

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

jest.mock('lucide-react', () => ({
  Trophy: () => <span data-testid="trophy-icon" />,
}));

describe('GameCard Component', () => {
  const mockGame: ProcessedGame = {
    id: 1,
    title: 'Elden Ring',
    platform: 'PlayStation 5',
    game_image: 'https://example.com/elden-ring.jpg',
    platinum: 1,
    gold: 4,
    silver: 14,
    bronze: 35,
    totalPoints: 1230,
  };

  it('renders correctly', () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText(mockGame.title)).toBeInTheDocument();
    expect(screen.getByText(mockGame.platform)).toBeInTheDocument();
    expect(screen.getByTestId('game-image')).toHaveAttribute('src', mockGame.game_image);
  });

  it('renders correct trophy counts', () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText(mockGame.platinum)).toBeInTheDocument();
    expect(screen.getByText(mockGame.gold)).toBeInTheDocument();
    expect(screen.getByText(mockGame.silver)).toBeInTheDocument();
    expect(screen.getByText(mockGame.bronze)).toBeInTheDocument();
  });

  it('generates correct link URL', () => {
    render(<GameCard game={mockGame} />);
    const expectedSlug = encodeURIComponent(
      mockGame.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    );
    const link = screen.getByTestId('game-link');
    expect(link).toHaveAttribute('href', `/pages/guide/${expectedSlug}`);
  });

  it('renders total points correctly', () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText(`⭐ Σύνολο Πόντων: ${mockGame.totalPoints}`)).toBeInTheDocument();
  });
});
