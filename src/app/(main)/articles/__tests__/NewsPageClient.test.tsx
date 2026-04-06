import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewsPageClient from '@/app/(main)/articles/NewsPageClient';
import { useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { getVisibleCategories } from '@/app/(main)/pages/_shared/categories';
import { CONTENT_PUBLISHED_EVENT } from '@/app/constants/contentEvents';
import { CATEGORY_LABELS, CATEGORY_SUBTITLES } from '@/app/(main)/articles/constants';

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('@/store/slices/authSlice', () => ({
  __esModule: true,
  selectIsAuthenticated: jest.fn(),
}));

jest.mock('@/app/(main)/pages/_shared/categories', () => ({
  __esModule: true,
  getVisibleCategories: jest.fn(),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    onClick,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <a
      href={href}
      className={className}
      onClick={event => {
        event.preventDefault();
        onClick?.();
      }}
    >
      {children}
    </a>
  ),
}));

jest.mock('@/app/components/layout', () => ({
  __esModule: true,
  PageContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-container">{children}</div>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  __esModule: true,
  Card: ({ children }: { children: React.ReactNode }) => <article>{children}</article>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/cover-image', () => ({
  __esModule: true,
  IMAGE_SIZES: { grid3: 'grid3' },
  CoverThumbImage: ({ alt }: { alt: string }) => (
    <span aria-label={alt} data-testid="cover-image" />
  ),
}));

jest.mock('@/components/ui/empty', () => ({
  __esModule: true,
  default: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}));

jest.mock('@/components/ui/alert', () => ({
  __esModule: true,
  ErrorAlert: ({ message }: { message: string }) => <div>{message}</div>,
}));

jest.mock('@/utils/components/FormattedDate', () => ({
  __esModule: true,
  FormattedDate: ({ date }: { date: string }) => <span>{date}</span>,
}));

jest.mock('@/utils/slugify', () => ({
  __esModule: true,
  normalizeSlug: (slug: string) => `normalized-${slug}`,
}));

const baseCategories = [
  'games',
  'anime',
  'manga',
  'movies',
  'tv',
  'books',
  'coding',
  'pet',
  'vape',
];

function setSearchParams(query = '') {
  (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(query));
}

function mockFetchResponse(payload: unknown, ok = true) {
  global.fetch = jest.fn(async () => ({
    ok,
    json: async () => payload,
  })) as jest.Mock;
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('NewsPageClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getVisibleCategories as jest.Mock).mockReturnValue(baseCategories);
    (useSelector as unknown as jest.Mock).mockReturnValue(true);
    setSearchParams('');
  });

  it('loads and renders filtered article cards with tag/category context', async () => {
    setSearchParams('category=games&tag=co-op');
    mockFetchResponse({
      data: [
        {
          id: 1,
          slug: 'first-post',
          title: 'First Post',
          description: 'A practical article',
          category: 'games',
          topic: 'tutorials',
          tags: ['coop', 'guide'],
          cover_image: 'https://img/cover.png',
          users: { username: 'john', display_name: 'John', avatar_url: null },
          reading_time_minutes: 5,
          published_at: '2026-01-01',
          views: 123,
          likes: 321,
        },
        {
          id: 2,
          slug: 'second-post',
          title: 'Second Post',
          description: null,
          category: 'games',
          topic: 'articles',
          tags: [],
          cover_image: null,
          users: null,
          reading_time_minutes: null,
          published_at: null,
          views: 11,
          likes: 22,
        },
        {
          id: 3,
          slug: 'review-post',
          title: 'Review Post',
          description: null,
          category: 'games',
          topic: 'reviews',
          tags: [],
          cover_image: null,
          users: null,
          reading_time_minutes: null,
          published_at: null,
          views: 11,
          likes: 22,
        },
      ],
    });

    render(<NewsPageClient />);

    expect(screen.getByRole('heading', { name: 'Games' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('First Post')).toBeInTheDocument();
    });
    expect(screen.getByText('Second Post')).toBeInTheDocument();

    expect(screen.queryByText('Review Post')).not.toBeInTheDocument();
    expect(screen.getByText('2 articles - co-op')).toBeInTheDocument();
    expect(screen.getByText('Tag:')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Clear' })).toHaveAttribute(
      'href',
      '/articles?category=games',
    );

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/articles?category=games&tag=co-op&status=published&limit=20',
    );
    expect(screen.getByText('123')).toBeInTheDocument();
    expect(screen.getByText('321')).toBeInTheDocument();
    expect(screen.getByTestId('cover-image')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'First Post' })).toHaveAttribute(
      'href',
      '/articles/normalized-first-post',
    );
  });

  it('hides engagement metrics when user is not authenticated', async () => {
    (useSelector as unknown as jest.Mock).mockReturnValue(false);
    mockFetchResponse({
      data: [
        {
          id: 3,
          slug: 'auth-post',
          title: 'Auth Post',
          description: 'desc',
          category: 'anime',
          topic: 'articles',
          tags: [],
          cover_image: null,
          users: null,
          reading_time_minutes: null,
          published_at: null,
          views: 777,
          likes: 888,
        },
      ],
    });

    render(<NewsPageClient />);

    await waitFor(() => {
      expect(screen.getByText('Auth Post')).toBeInTheDocument();
    });

    expect(screen.queryByText('777')).not.toBeInTheDocument();
    expect(screen.queryByText('888')).not.toBeInTheDocument();
  });

  it('shows error alert when articles fetch fails', async () => {
    setSearchParams('category=invalid');
    mockFetchResponse({}, false);

    render(<NewsPageClient />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch articles')).toBeInTheDocument();
    });
  });

  it('shows empty state with default description when there are no articles', async () => {
    setSearchParams('');
    mockFetchResponse({ data: [] });

    render(<NewsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    expect(screen.getByText('No articles yet')).toBeInTheDocument();
    expect(screen.getByText('No published articles are available yet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('href', '/articles');
  });

  it('refreshes list only when article publication event is dispatched', async () => {
    setSearchParams('category=games');
    mockFetchResponse({
      data: [
        {
          id: 8,
          slug: 'event-post',
          title: 'Event Post',
          description: 'desc',
          category: 'games',
          topic: 'articles',
          tags: [],
          cover_image: null,
          users: null,
          reading_time_minutes: null,
          published_at: null,
          views: 1,
          likes: 2,
        },
      ],
    });

    const { unmount } = render(<NewsPageClient />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(CONTENT_PUBLISHED_EVENT, {
          detail: { type: 'review' },
        }),
      );
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(CONTENT_PUBLISHED_EVENT, {
          detail: { type: 'article' },
        }),
      );
    });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    unmount();
  });

  it('supports category filter navigation links with current tag', async () => {
    const user = userEvent.setup();
    setSearchParams('category=games&tag=retro');
    mockFetchResponse({ data: [] });

    render(<NewsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    const animeFilter = screen.getByRole('link', { name: 'Anime' });
    expect(animeFilter).toHaveAttribute('href', '/articles?category=anime&tag=retro');

    await user.click(animeFilter);
  });

  it('falls back safely for unexpected article payload values', async () => {
    setSearchParams('');
    mockFetchResponse({
      data: [
        {
          id: 31,
          slug: 'unexpected',
          title: 'Unexpected Payload',
          description: 'desc',
          category: 'unknown',
          topic: 'articles',
          tags: ['weird'],
          cover_image: null,
          users: { username: 'fallback-user', display_name: null, avatar_url: null },
          reading_time_minutes: 3,
          published_at: '2026-01-04',
          views: undefined,
          likes: undefined,
        },
      ],
    });

    render(<NewsPageClient />);

    await waitFor(() => {
      expect(screen.getByText('Unexpected Payload')).toBeInTheDocument();
    });

    expect(screen.getByText('unknown')).toBeInTheDocument();
    expect(screen.getByText('fallback-user')).toBeInTheDocument();
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2);
  });

  it('uses safe defaults when API payload lacks data array', async () => {
    setSearchParams('category=games');
    mockFetchResponse({});

    render(<NewsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('shows generic error message when rejection is not an Error instance', async () => {
    setSearchParams('');
    global.fetch = jest.fn(async () => {
      throw 'network-failure';
    }) as jest.Mock;

    render(<NewsPageClient />);

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('falls back to raw filter label when category label mapping is missing', async () => {
    const originalGamesLabel = CATEGORY_LABELS.games;
    (CATEGORY_LABELS as Record<string, string | undefined>).games = undefined;
    (getVisibleCategories as jest.Mock).mockReturnValue(['games']);
    setSearchParams('');
    mockFetchResponse({ data: [] });

    render(<NewsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: 'games' })).toBeInTheDocument();

    (CATEGORY_LABELS as Record<string, string | undefined>).games = originalGamesLabel;
  });

  it('uses fallback title/subtitle when selected category metadata mapping is missing', async () => {
    const originalGamesLabel = CATEGORY_LABELS.games;
    const originalGamesSubtitle = CATEGORY_SUBTITLES.games;
    (CATEGORY_LABELS as Record<string, string | undefined>).games = undefined;
    (CATEGORY_SUBTITLES as Record<string, string | undefined>).games = undefined;

    (getVisibleCategories as jest.Mock).mockReturnValue(['games']);
    setSearchParams('category=games');
    mockFetchResponse({ data: [] });

    render(<NewsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: 'Articles' })).toBeInTheDocument();
    expect(
      screen.getByText('Community-written articles and stories, clearly organized.'),
    ).toBeInTheDocument();

    (CATEGORY_LABELS as Record<string, string | undefined>).games = originalGamesLabel;
    (CATEGORY_SUBTITLES as Record<string, string | undefined>).games = originalGamesSubtitle;
  });

  it('renders suspense fallback while search params are suspended', () => {
    (useSearchParams as jest.Mock).mockImplementation(() => {
      throw new Promise(() => {});
    });

    const { container } = render(<NewsPageClient />);
    expect(screen.queryByText('Editorial Desk')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('does not update state after unmount when success response resolves later', async () => {
    const deferred = createDeferred<{ ok: boolean; json: () => Promise<{ data: unknown[] }> }>();
    global.fetch = jest.fn(() => deferred.promise) as jest.Mock;

    const { unmount } = render(<NewsPageClient />);
    unmount();

    await act(async () => {
      deferred.resolve({
        ok: true,
        json: async () => ({ data: [] }),
      });
      await Promise.resolve();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('does not update state after unmount when fetch throws later', async () => {
    const deferred = createDeferred<never>();
    global.fetch = jest.fn(() => deferred.promise) as jest.Mock;

    const { unmount } = render(<NewsPageClient />);
    unmount();

    await act(async () => {
      deferred.reject(new Error('late failure'));
      await Promise.resolve();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
