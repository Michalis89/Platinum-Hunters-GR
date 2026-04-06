import { act, render, screen, waitFor } from '@testing-library/react';
import PublicBacklogClient from '@/app/(main)/u/[username]/backlog/PublicBacklogClient';
import { useRouter, useSearchParams } from 'next/navigation';

let shouldSuspendCategoryLibrary = false;
let suspendPromise: Promise<void> | null = null;
let resolveSuspend: (() => void) | null = null;

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@/components/ui/spinner', () => ({
  __esModule: true,
  Spinner: ({ className }: { className?: string }) => (
    <div data-testid="spinner" data-class={className} />
  ),
}));

jest.mock('@/components/ui/skeleton', () => ({
  __esModule: true,
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" data-class={className} />
  ),
}));

jest.mock('@/app/components/backlog/CategoryLibrary', () => ({
  __esModule: true,
  default: (props: {
    category: string;
    username: string;
    initialStatus?: string;
    initialSearch?: string;
    isReadOnly: boolean;
    canToggleFavorite: boolean;
    publicUserId: string;
    shareToken?: string;
  }) => {
    if (shouldSuspendCategoryLibrary && suspendPromise) {
      throw suspendPromise;
    }
    return <div data-testid="category-library">{JSON.stringify(props)}</div>;
  },
}));

describe('PublicBacklogClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    shouldSuspendCategoryLibrary = false;
    suspendPromise = null;
    resolveSuspend = null;
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn(), replace: jest.fn() });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''));
  });

  it('renders CategoryLibrary with validated query params and read-only props', () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams('category=tv&status=Completed&search=%20dark%20'),
    );

    render(
      <PublicBacklogClient
        userId="user-1"
        username="mike"
        defaultCategory="anime"
        canToggleFavorite
        shareToken="share-1"
      />,
    );

    const props = JSON.parse(screen.getByTestId('category-library').textContent ?? '{}');
    expect(props).toMatchObject({
      category: 'tv',
      username: 'mike',
      initialStatus: 'completed',
      initialSearch: 'dark',
      isReadOnly: true,
      canToggleFavorite: true,
      publicUserId: 'user-1',
      shareToken: 'share-1',
    });
  });

  it('falls back to the default category and leaves unknown status undefined', () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams('category=invalid&status=unknown'),
    );

    render(<PublicBacklogClient userId="user-1" username="mike" defaultCategory="books" />);

    const props = JSON.parse(screen.getByTestId('category-library').textContent ?? '{}');
    expect(props).toMatchObject({
      category: 'books',
    });
    expect(props).not.toHaveProperty('initialSearch');
    expect(props).not.toHaveProperty('initialStatus');
    expect(props.canToggleFavorite).toBe(false);
  });

  it('renders the suspense fallback while CategoryLibrary is suspended', async () => {
    shouldSuspendCategoryLibrary = true;
    suspendPromise = new Promise<void>(resolve => {
      resolveSuspend = () => {
        shouldSuspendCategoryLibrary = false;
        resolve();
      };
    });

    render(<PublicBacklogClient userId="user-1" username="mike" defaultCategory="anime" />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();

    await act(async () => {
      resolveSuspend?.();
      await suspendPromise;
    });

    await waitFor(() => {
      expect(screen.getByTestId('category-library')).toBeInTheDocument();
    });
  });
});
