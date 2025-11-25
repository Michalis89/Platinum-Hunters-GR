import { act, render, screen, waitFor } from '@testing-library/react';
import { useParams } from 'next/navigation';
import GameDetailsPage from './page';

jest.mock('next/dynamic', () => () => {
  const DynamicComponent = () => <div>Mocked Dynamic Component</div>;
  DynamicComponent.displayName = 'MockedDynamicComponent';
  return DynamicComponent;
});

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

global.fetch = jest.fn();

const mockGame = {
  id: 1,
  title: 'Test Game',
  cover_image: '/test-image.png',
};

const mockGuides = [
  {
    id: 1,
    difficulty_rating: 5,
    estimated_playthroughs: 1,
    estimated_hours: 10,
  },
];

const mockGameDetails = {
  id: 1,
  description: 'Test description',
  platforms: ['PS4', 'PC'],
};

const mockTrophies = {
  platinum: 1,
  gold: 2,
  silver: 3,
  bronze: 4,
};

describe('GameDetailsPage', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({ slug: 'test-game' });
    fetchMock = jest.fn();
    global.fetch = fetchMock;

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockGame]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGuides),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGameDetails),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTrophies),
      });
  });

  it('renders loading skeleton when data is not yet loaded', async () => {
    await act(async () => {
      render(<GameDetailsPage />);
    });

    expect(await screen.findByTestId('skeleton')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(mockGame.title)).toBeInTheDocument();
    });
  });

  it('renders game details after loading', async () => {
    await act(async () => {
      render(<GameDetailsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText(mockGame.title)).toBeInTheDocument();
      expect(screen.getByAltText(mockGame.title)).toHaveAttribute('src', mockGame.cover_image);
    });
  });

  it('displays guide stats when guides are available', async () => {
    await act(async () => {
      render(<GameDetailsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('5 Δυσκολία')).toBeInTheDocument();
      expect(screen.getByText('1 Πέρασμα')).toBeInTheDocument();
      expect(screen.getByText('10 Ώρες')).toBeInTheDocument();
    });
  });

  it('handles fetch error gracefully', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Fetch failed'));

    await act(async () => {
      render(<GameDetailsPage />);
    });

    await waitFor(() => {
      expect(screen.queryByText(mockGame.title)).not.toBeInTheDocument();
    });
  });
});
