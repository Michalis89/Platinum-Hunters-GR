import { render, screen, waitFor } from '@testing-library/react';
import AboutStatsLoader from '@/app/(main)/about/AboutStatsLoader.client';

const aboutStatsMock = jest.fn((props: Record<string, number>) => (
  <div data-testid="about-stats">{JSON.stringify(props)}</div>
));

jest.mock('@/app/components/about/AboutStats', () => ({
  __esModule: true,
  AboutStats: (props: Record<string, number>) => aboutStatsMock(props),
}));

jest.mock('@/components/ui/spinner', () => ({
  __esModule: true,
  Spinner: () => <div role="status" aria-label="Loading" data-testid="spinner" />,
}));

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('AboutStatsLoader', () => {
  beforeEach(() => {
    aboutStatsMock.mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows spinner first and then renders fetched stats', async () => {
    const stats = {
      totalUsers: 15,
      totalGames: 20,
      totalAnime: 5,
      totalManga: 2,
      totalMovies: 8,
      totalTv: 3,
      totalBooks: 4,
      totalArticles: 7,
    };

    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => stats,
    })) as jest.Mock;

    render(<AboutStatsLoader />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('about-stats')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/public/stats');
    expect(aboutStatsMock).toHaveBeenCalledWith(stats);
  });

  it('falls back to empty stats when fetch is not ok', async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      json: async () => ({}),
    })) as jest.Mock;

    render(<AboutStatsLoader />);

    await waitFor(() => {
      expect(aboutStatsMock).toHaveBeenCalledTimes(1);
    });

    expect(console.error).toHaveBeenCalled();
    expect(aboutStatsMock).toHaveBeenCalledWith({
      totalUsers: 0,
      totalGames: 0,
      totalAnime: 0,
      totalManga: 0,
      totalMovies: 0,
      totalTv: 0,
      totalBooks: 0,
      totalArticles: 0,
    });
  });

  it('does not set state after unmount when request resolves later', async () => {
    const deferred = createDeferred<{ ok: boolean; json: () => Promise<Record<string, number>> }>();
    global.fetch = jest.fn(() => deferred.promise) as jest.Mock;

    const { unmount } = render(<AboutStatsLoader />);
    unmount();

    deferred.resolve({
      ok: true,
      json: async () => ({
        totalUsers: 1,
        totalGames: 1,
        totalAnime: 1,
        totalManga: 1,
        totalMovies: 1,
        totalTv: 1,
        totalBooks: 1,
        totalArticles: 1,
      }),
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    expect(aboutStatsMock).toHaveBeenCalledTimes(0);
  });
});
