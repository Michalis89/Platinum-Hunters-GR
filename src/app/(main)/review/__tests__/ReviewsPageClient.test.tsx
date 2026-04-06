import { act, render, screen, waitFor } from '@testing-library/react';
import ReviewsPageClient from '@/app/(main)/review/ReviewsPageClient';
import { useSelector } from 'react-redux';
import { getVisibleCategories } from '@/app/(main)/pages/_shared/categories';
import { CONTENT_PUBLISHED_EVENT } from '@/app/constants/contentEvents';
import { CATEGORY_LABELS } from '@/app/(main)/articles/constants';
import type { ArticleCategory, ArticleRow } from '@/types/database';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('@/store/slices/authSlice', () => ({
  __esModule: true,
  selectIsAuthenticated: jest.fn(),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock('@/components/ui/cover-image', () => ({
  __esModule: true,
  CoverThumbImage: ({ alt }: { alt: string }) => <span aria-label={alt} data-testid="cover-thumb" />,
}));

jest.mock('lucide-react', () => ({
  Calendar: () => <span data-testid="calendar-icon" />,
  Clock: () => <span data-testid="clock-icon" />,
  Eye: () => <span data-testid="eye-icon" />,
  Heart: () => <span data-testid="heart-icon" />,
  Star: ({ className }: { className?: string }) => (
    <span data-testid="star-icon" className={className} />
  ),
  Tag: () => <span data-testid="tag-icon" />,
  User: () => <span data-testid="user-icon" />,
}));

jest.mock('@/app/components/layout', () => ({
  __esModule: true,
  PageContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-container">{children}</div>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  __esModule: true,
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <article data-testid="card" className={className}>
      {children}
    </article>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 className={className}>{children}</h2>
  ),
  CardDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <p className={className}>{children}</p>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
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
  ErrorAlert: ({ message }: { message: string }) => <div data-testid="error-alert">{message}</div>,
}));

jest.mock('@/app/(main)/articles/constants', () => ({
  __esModule: true,
  CATEGORY_LABELS: {
    games: 'Games',
    anime: 'Anime',
    manga: 'Manga',
    movies: 'Movies',
    tv: 'TV',
    books: 'Books',
    coding: 'Coding',
    pet: 'Pets',
    vape: 'Vape',
  },
}));

jest.mock('@/utils/slugify', () => ({
  __esModule: true,
  normalizeSlug: (slug: string) => `normalized-${slug}`,
}));

jest.mock('@/app/(main)/pages/_shared/categories', () => ({
  __esModule: true,
  getVisibleCategories: jest.fn(),
}));

jest.mock('@/utils/components/FormattedDate', () => ({
  __esModule: true,
  FormattedDate: ({ date }: { date: string }) => <span>{date}</span>,
}));

const visibleCategories = [
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

type TestArticleWithAuthor = ArticleRow & {
  users?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

type ReviewsPageClientProps = Parameters<typeof ReviewsPageClient>[0];

function createArticle(overrides: Partial<TestArticleWithAuthor> = {}): TestArticleWithAuthor {
  return {
    id: 1,
    slug: 'elden-ring',
    title: 'Elden Ring Review',
    description: 'A tough but fair journey.',
    category: 'games',
    tags: ['soulslike', 'rpg', 'open world', 'extra'],
    cover_image: 'https://img.test/cover.jpg',
    users: {
      username: 'mike',
      display_name: 'Mike',
      avatar_url: null,
    },
    reading_time_minutes: 7,
    published_at: '2026-03-01',
    views: 123,
    likes: 45,
    ...overrides,
  };
}

function jsonResponse(body: unknown, ok = true): Promise<Response> {
  return Promise.resolve({
    ok,
    json: async () => body,
  } as Response);
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

describe('ReviewsPageClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSelector as jest.Mock).mockReturnValue(true);
    (getVisibleCategories as jest.Mock).mockReturnValue(visibleCategories);
    global.fetch = jest.fn(() => jsonResponse({ data: [], meta: { total: 0 } })) as jest.Mock;
  });

  it('renders initial articles with authenticated engagement metrics and tag context', () => {
    render(
      <ReviewsPageClient
        initialArticles={[createArticle()]}
        initialTotal={1}
        initialCategory="games"
        initialTag="soulslike"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Reviews - Games' })).toBeInTheDocument();
    expect(screen.getByText('Community reviews for Games.')).toBeInTheDocument();
    expect(screen.getByText('1 review - soulslike')).toBeInTheDocument();
    expect(screen.getByText('Elden Ring Review')).toBeInTheDocument();
    expect(screen.getByText('A tough but fair journey.')).toBeInTheDocument();
    expect(screen.getByText('Mike')).toBeInTheDocument();
    expect(screen.getByText('2026-03-01')).toBeInTheDocument();
    expect(screen.getByText('7 min read')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Elden Ring Review' })).toHaveAttribute(
      'href',
      '/review/normalized-elden-ring',
    );
    expect(screen.getByRole('link', { name: 'soulslike' })).toHaveAttribute(
      'href',
      '/review?tag=soulslike',
    );
    expect(screen.getByRole('link', { name: 'rpg' })).toHaveAttribute('href', '/review?tag=rpg');
    expect(screen.getByRole('link', { name: 'open world' })).toHaveAttribute(
      'href',
      '/review?tag=open%20world',
    );
    expect(screen.queryByRole('link', { name: 'extra' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Clear' })).toHaveAttribute(
      'href',
      '/review?category=games',
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('hides engagement metrics for unauthenticated users and renders fallback card media', () => {
    (useSelector as jest.Mock).mockReturnValue(false);

    render(
      <ReviewsPageClient
        initialArticles={[
          createArticle({
            cover_image: null,
            users: null,
            reading_time_minutes: null,
            published_at: null,
            views: 99,
            likes: 77,
          }),
        ]}
        initialTotal={1}
      />,
    );

    expect(screen.queryByText('99')).not.toBeInTheDocument();
    expect(screen.queryByText('77')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('star-icon').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('cover-thumb')).not.toBeInTheDocument();
    expect(screen.getByText('1 review')).toBeInTheDocument();
  });

  it('falls back to generic title and marks the all filter active for invalid initial category', () => {
    render(
      <ReviewsPageClient
        initialArticles={[]}
        initialTotal={0}
        initialCategory={'invalid' as unknown as NonNullable<ReviewsPageClientProps['initialCategory']>}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Reviews' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Browse community reviews for games, anime, manga, movies, TV, books, and more.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows the empty state description for a selected category', () => {
    render(<ReviewsPageClient initialArticles={[]} initialTotal={0} initialCategory="anime" />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('No reviews yet')).toBeInTheDocument();
    expect(screen.getByText('No reviews were found for the "Anime" category.')).toBeInTheDocument();
  });

  it('uses generic empty copy and zero-count fallback when a refresh returns an empty payload object', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    render(<ReviewsPageClient initialArticles={[createArticle()]} initialTotal={5} />);

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(CONTENT_PUBLISHED_EVENT, {
          detail: { type: 'review' },
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    expect(screen.getByText('No published reviews are available yet.')).toBeInTheDocument();
    expect(screen.getByText('0 reviews')).toBeInTheDocument();
  });

  it('fetches reviews after a content published review event and updates the list', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      jsonResponse({
        data: [createArticle({ id: 2, title: 'Refetched Review', slug: 'refetched-review' })],
        meta: { total: 2 },
      }),
    );

    render(
      <ReviewsPageClient
        initialArticles={[createArticle()]}
        initialTotal={1}
        initialCategory="games"
        initialTag="soulslike"
      />,
    );

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(CONTENT_PUBLISHED_EVENT, {
          detail: { type: 'article' },
        }),
      );
    });

    expect(global.fetch).not.toHaveBeenCalled();

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(CONTENT_PUBLISHED_EVENT, {
          detail: { type: 'review' },
        }),
      );
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/articles?category=games&tag=soulslike&topic=reviews&status=published&limit=20',
      );
    });
    await waitFor(() => {
      expect(screen.getByText('Refetched Review')).toBeInTheDocument();
    });
    expect(screen.getByText('2 reviews - soulslike')).toBeInTheDocument();
  });

  it('shows skeleton cards while a fetch is pending', async () => {
    const deferred = createDeferred<Response>();
    (global.fetch as jest.Mock).mockReturnValueOnce(deferred.promise);

    render(<ReviewsPageClient initialArticles={[createArticle()]} initialTotal={1} />);

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(CONTENT_PUBLISHED_EVENT, {
          detail: { type: 'review' },
        }),
      );
    });

    await waitFor(() => {
      expect(document.querySelectorAll('.min-h-\\[320px\\]').length).toBe(6);
    });

    await act(async () => {
      deferred.resolve({
        ok: true,
        json: async () => ({
          data: [createArticle({ id: 3, title: 'Loaded Later' })],
          meta: { total: 1 },
        }),
      } as Response);
    });

    await waitFor(() => {
      expect(screen.getByText('Loaded Later')).toBeInTheDocument();
    });
  });

  it('shows an error alert when review fetching fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response);

    render(<ReviewsPageClient initialArticles={[]} initialTotal={0} initialCategory="tv" />);

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(CONTENT_PUBLISHED_EVENT, {
          detail: { type: 'review' },
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toHaveTextContent('Failed to fetch reviews');
    });
  });

  it('shows a generic error message for non-Error fetch failures', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce('bad');

    render(<ReviewsPageClient initialArticles={[]} initialTotal={0} />);

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(CONTENT_PUBLISHED_EVENT, {
          detail: { type: 'review' },
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toHaveTextContent('Something went wrong');
    });
  });

  it('uses only allowed visible categories in the filter bar', () => {
    (getVisibleCategories as jest.Mock).mockReturnValue(['games', 'books']);

    render(<ReviewsPageClient initialArticles={[]} initialTotal={0} />);

    expect(screen.getByRole('link', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Games' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Books' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Anime' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Books' })).toHaveAttribute(
      'href',
      '/review?category=books',
    );
  });

  it('falls back to raw category values when a visible primary category has no configured label', () => {
    const originalBooksLabel = CATEGORY_LABELS.books;
    delete (CATEGORY_LABELS as Record<string, string | undefined>).books;
    (getVisibleCategories as jest.Mock).mockReturnValue(['games', 'books']);

    render(
      <ReviewsPageClient
        initialArticles={[createArticle({ category: 'books' as ArticleCategory })]}
        initialTotal={1}
        initialCategory="books"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Reviews' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'books' })).toHaveAttribute(
      'href',
      '/review?category=books',
    );
    expect(screen.getByRole('link', { name: 'books' })).toHaveAttribute('aria-current', 'page');

    (CATEGORY_LABELS as Record<string, string | undefined>).books = originalBooksLabel;
  });

  it('falls back to username and zero engagement counts when optional article fields are missing', () => {
    render(
      <ReviewsPageClient
        initialArticles={[
          createArticle({
            category: 'manga',
            description: null,
            tags: null,
            users: {
              username: 'fallback-user',
              display_name: null,
              avatar_url: null,
            },
            views: null,
            likes: null,
          }),
        ]}
        initialTotal={1}
        initialCategory="manga"
      />,
    );

    expect(screen.getByText('fallback-user')).toBeInTheDocument();
    expect(screen.queryByText('A tough but fair journey.')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'soulslike' })).not.toBeInTheDocument();
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2);
  });

  it('avoids state updates after a successful fetch resolves post-unmount', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const deferred = createDeferred<Response>();
    (global.fetch as jest.Mock).mockReturnValueOnce(deferred.promise);

    const { unmount } = render(<ReviewsPageClient initialArticles={[]} initialTotal={0} />);

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(CONTENT_PUBLISHED_EVENT, {
          detail: { type: 'review' },
        }),
      );
    });

    unmount();

    await act(async () => {
      deferred.resolve({
        ok: true,
        json: async () => ({
          data: [createArticle({ id: 5, title: 'Late Review' })],
          meta: { total: 1 },
        }),
      } as Response);
    });

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('avoids state updates after a failed fetch rejects post-unmount', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const deferred = createDeferred<Response>();
    (global.fetch as jest.Mock).mockReturnValueOnce(deferred.promise);

    const { unmount } = render(<ReviewsPageClient initialArticles={[]} initialTotal={0} />);

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(CONTENT_PUBLISHED_EVENT, {
          detail: { type: 'review' },
        }),
      );
    });

    unmount();

    await act(async () => {
      deferred.reject(new Error('too late'));
      try {
        await deferred.promise;
      } catch {}
    });

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
