import { render, screen } from '@testing-library/react';
import GameCard from '../GameCard';
import { ProcessedGame } from '@/types/interfaces'; // Import the correct interface

jest.mock('next/image', () => {
  const MockImage = (props: { alt: string; src: string }) => <div data-testid="game-image" {...props} />;
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
    platforms: ['PlayStation 5'],
    cover_image: 'https://example.com/elden-ring.jpg',
    background_image: 'https://example.com/elden-ring-bg.jpg',
    trophy_platinum: 1,
    trophy_gold: 4,
    trophy_silver: 14,
    trophy_bronze: 35,
    totalPoints: 1230,
  };

  it('renders correctly', () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText(mockGame.title)).toBeInTheDocument();
    expect(screen.getByText('PlayStation 5')).toBeInTheDocument();
    expect(screen.getByTestId('game-image')).toHaveAttribute('src', mockGame.cover_image);
  });

  it('renders correct trophy counts', () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText(mockGame.trophy_platinum.toString())).toBeInTheDocument();
    expect(screen.getByText(mockGame.trophy_gold.toString())).toBeInTheDocument();
    expect(screen.getByText(mockGame.trophy_silver.toString())).toBeInTheDocument();
    expect(screen.getByText(mockGame.trophy_bronze.toString())).toBeInTheDocument();
  });

  it('generates correct link URL', () => {
    render(<GameCard game={mockGame} />);
    const expectedSlug = encodeURIComponent(
      mockGame.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    );
    const link = screen.getByTestId('game-link');
    expect(link).toHaveAttribute('href', `/pages/guides/${expectedSlug}`);
  });

  it('renders total points correctly', () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText(`⭐ Σύνολο Πόντων: ${mockGame.totalPoints}`)).toBeInTheDocument();
  });
});
