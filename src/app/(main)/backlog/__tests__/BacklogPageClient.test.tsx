import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BacklogPageClient from '@/app/(main)/backlog/BacklogPageClient';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('@/store/slices/authSlice', () => ({
  __esModule: true,
  selectUser: jest.fn(),
}));

const categoryLibraryMock = jest.fn(
  ({
    category,
    username,
    steamId,
    initialStatus,
    initialSearch,
  }: {
    category: string;
    username?: string;
    steamId?: string;
    initialStatus?: string;
    initialSearch?: string;
  }) => (
    <div data-testid="category-library">
      <span>{`category:${category}`}</span>
      <span>{`username:${String(username)}`}</span>
      <span>{`steamId:${String(steamId)}`}</span>
      <span>{`initialStatus:${String(initialStatus)}`}</span>
      <span>{`initialSearch:${String(initialSearch)}`}</span>
    </div>
  ),
);

jest.mock('@/app/components/backlog/CategoryLibrary', () => ({
  __esModule: true,
  default: (props: {
    category: string;
    username?: string;
    steamId?: string;
    initialStatus?: string;
    initialSearch?: string;
  }) => categoryLibraryMock(props),
}));

jest.mock('@/components/ui/spinner', () => ({
  __esModule: true,
  Spinner: () => <div data-testid="spinner" />,
}));

jest.mock('@/components/ui/skeleton', () => ({
  __esModule: true,
  Skeleton: () => <div data-testid="skeleton" />,
}));

jest.mock('@/components/ui/button', () => ({
  __esModule: true,
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

function makeSearchParams(query: string) {
  return new URLSearchParams(query);
}

function makeUser({
  username = 'mike',
  categoryProfile = { games: { steam_id: 'steam-123' } },
}: {
  username?: string;
  categoryProfile?: Record<string, unknown>;
} = {}) {
  return {
    username,
    category_profile: categoryProfile,
  };
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

describe('BacklogPageClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSearchParams as jest.Mock).mockReturnValue(makeSearchParams(''));
    (useSelector as jest.Mock).mockReturnValue(makeUser());
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
    });
    global.fetch = jest.fn(async () => ({ ok: true })) as jest.Mock;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows skeleton placeholders before client mount', () => {
    (useSelector as jest.Mock).mockReturnValue(null);
    render(<BacklogPageClient />);
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('renders category library with parsed params and game steam id', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      makeSearchParams('category=games&status=Completed&search=%20zelda%20'),
    );

    render(<BacklogPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId('category-library')).toBeInTheDocument();
    });

    expect(screen.getByText('category:games')).toBeInTheDocument();
    expect(screen.getByText('username:mike')).toBeInTheDocument();
    expect(screen.getByText('steamId:steam-123')).toBeInTheDocument();
    expect(screen.getByText('initialStatus:completed')).toBeInTheDocument();
    expect(screen.getByText('initialSearch:zelda')).toBeInTheDocument();
  });

  it('defaults to games category and undefined status for unsupported params', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      makeSearchParams('category=invalid&status=not-real'),
    );

    render(<BacklogPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId('category-library')).toBeInTheDocument();
    });

    expect(screen.getByText('category:games')).toBeInTheDocument();
    expect(screen.getByText('initialStatus:undefined')).toBeInTheDocument();
  });

  it('shows access denied when category is not enabled and handles CTA navigation', async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push,
      replace: jest.fn(),
    });
    (useSearchParams as jest.Mock).mockReturnValue(makeSearchParams('category=anime'));
    (useSelector as jest.Mock).mockReturnValue(
      makeUser({
        categoryProfile: { games: { steam_id: 'steam-123' } },
      }),
    );

    const user = userEvent.setup();
    render(<BacklogPageClient />);

    await waitFor(() => {
      expect(screen.getByText('You do not have access to this category')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Profile Settings' }));
    await user.click(screen.getByRole('button', { name: 'Back to Backlog' }));

    expect(push).toHaveBeenNthCalledWith(1, '/profile/edit');
    expect(push).toHaveBeenNthCalledWith(2, '/backlog');
  });

  it('triggers MAL auto-sync once and replaces URL without mal params', async () => {
    const replace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace,
    });
    (useSearchParams as jest.Mock).mockImplementation(() =>
      makeSearchParams(
        'category=anime&status=planned&mal=success&mal_reason=abc&mal_token_error=oops',
      ),
    );
    (useSelector as jest.Mock).mockReturnValue(
      makeUser({
        categoryProfile: { anime: {} },
      }),
    );

    render(<BacklogPageClient />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/integrations/mal/sync?category=anime', {
        method: 'POST',
      });
    });
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/backlog?category=anime&status=planned');
    });

    expect((global.fetch as jest.Mock).mock.calls.length).toBe(1);
    expect(categoryLibraryMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('handles MAL sync fetch failure and still replaces URL', async () => {
    const replace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace,
    });
    (useSearchParams as jest.Mock).mockReturnValue(makeSearchParams('category=manga&mal=success'));
    (useSelector as jest.Mock).mockReturnValue(
      makeUser({
        categoryProfile: { manga: {} },
      }),
    );
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('sync failed'));

    render(<BacklogPageClient />);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Auto MAL sync failed:', expect.any(Error));
    });
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/backlog?category=manga');
    });
  });

  it('falls back to /backlog when computed query string is empty', async () => {
    const replace = jest.fn();
    const toStringSpy = jest.spyOn(URLSearchParams.prototype, 'toString').mockReturnValue('');
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace,
    });
    (useSearchParams as jest.Mock).mockReturnValue(
      makeSearchParams('category=anime&mal=success&mal_reason=abc&mal_token_error=def'),
    );
    (useSelector as jest.Mock).mockReturnValue(
      makeUser({
        categoryProfile: { anime: {} },
      }),
    );

    render(<BacklogPageClient />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/backlog');
    });
    toStringSpy.mockRestore();
  });

  it('does not replace URL when MAL sync resolves after unmount', async () => {
    const replace = jest.fn();
    const deferred = createDeferred<{ ok: boolean }>();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace,
    });
    (useSearchParams as jest.Mock).mockReturnValue(makeSearchParams('category=anime&mal=success'));
    (useSelector as jest.Mock).mockReturnValue(
      makeUser({
        categoryProfile: { anime: {} },
      }),
    );
    (global.fetch as jest.Mock).mockImplementation(() => deferred.promise);

    const { unmount } = render(<BacklogPageClient />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    unmount();

    await act(async () => {
      deferred.resolve({ ok: true });
      await Promise.resolve();
    });

    expect(replace).not.toHaveBeenCalled();
  });

  it('renders suspense fallback when search params are suspended', () => {
    (useSearchParams as jest.Mock).mockImplementation(() => {
      throw new Promise(() => {});
    });

    render(<BacklogPageClient />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });
});
