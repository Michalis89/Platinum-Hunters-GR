import { act, render, screen, waitFor } from '@testing-library/react';
import PublicBacklogPage, {
  generateMetadata,
  revalidate,
} from '@/app/(main)/u/[username]/backlog/page';
import getSupabaseServer from '@/lib/supabase-server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { notFound } from 'next/navigation';

let shouldSuspendBacklogClient = false;
let suspendPromise: Promise<void> | null = null;
let resolveSuspend: (() => void) | null = null;

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

jest.mock('@/lib/supabase-server', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: jest.fn(),
}));

jest.mock('@/components/ui/skeleton', () => ({
  __esModule: true,
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" data-class={className} />
  ),
}));

jest.mock('@/app/(main)/u/[username]/backlog/PublicBacklogClient', () => ({
  __esModule: true,
  default: (props: {
    userId: string;
    username: string;
    defaultCategory: string;
    canToggleFavorite: boolean;
  }) => {
    if (shouldSuspendBacklogClient && suspendPromise) {
      throw suspendPromise;
    }
    return <div data-testid="public-backlog-client">{JSON.stringify(props)}</div>;
  },
}));

type QueryResult = { data?: unknown };

function createSupabaseMock(results: Record<string, QueryResult>) {
  return {
    from: jest.fn((table: string) => ({
      select: jest.fn(() => ({
        eq: jest.fn((column: string, value: string) => ({
          maybeSingle: jest
            .fn()
            .mockResolvedValue(results[`${table}:${column}:${value}`] ?? { data: null }),
        })),
      })),
    })),
  };
}

describe('u/[username]/backlog/page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    shouldSuspendBacklogClient = false;
    suspendPromise = null;
    resolveSuspend = null;
  });

  it('exports metadata and revalidate', async () => {
    expect(revalidate).toBe(60);
    await expect(
      generateMetadata({
        params: Promise.resolve({ username: 'mike' }),
        searchParams: Promise.resolve({}),
      }),
    ).resolves.toMatchObject({
      title: "mike's Library | Hobbistas",
      description: "Browse mike's read-only media library on Hobbistas.",
      robots: { index: false },
    });
  });

  it('calls notFound when the user does not exist', async () => {
    (getSupabaseServer as jest.Mock).mockReturnValue(
      createSupabaseMock({
        'users:username:missing': { data: null },
      }),
    );
    (notFound as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });

    await expect(
      PublicBacklogPage({
        params: Promise.resolve({ username: 'missing' }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('renders private profile state when profile visibility is private', async () => {
    (getSupabaseServer as jest.Mock).mockReturnValue(
      createSupabaseMock({
        'users:username:mike': {
          data: {
            id: 'u1',
            username: 'mike',
            privacy_settings: { profile_visibility: 'private' },
          },
        },
      }),
    );

    render(
      await PublicBacklogPage({
        params: Promise.resolve({ username: 'mike' }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByText('Private Profile')).toBeInTheDocument();
    expect(
      screen.getByText("This user's library is private. Ask them for a share link."),
    ).toBeInTheDocument();
  });

  it('renders public backlog client with requested category and favorite toggle ownership', async () => {
    (getSupabaseServer as jest.Mock).mockReturnValue(
      createSupabaseMock({
        'users:username:mike': {
          data: {
            id: 'u1',
            username: 'mike',
            privacy_settings: { profile_visibility: 'public' },
          },
        },
        'user_category_profiles:user_id:u1': {
          data: { profiles: { manga: { enabled: true }, anime: { enabled: true } } },
        },
      }),
    );
    (createRouteHandlerClient as jest.Mock).mockResolvedValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'u1' } } },
        }),
      },
    });

    render(
      await PublicBacklogPage({
        params: Promise.resolve({ username: 'mike' }),
        searchParams: Promise.resolve({ category: 'tv' }),
      }),
    );

    const props = JSON.parse(screen.getByTestId('public-backlog-client').textContent ?? '{}');
    expect(props).toMatchObject({
      userId: 'u1',
      username: 'mike',
      defaultCategory: 'tv',
      canToggleFavorite: true,
    });
  });

  it('falls back to first profile category and then anime when no category is provided', async () => {
    (getSupabaseServer as jest.Mock)
      .mockReturnValueOnce(
        createSupabaseMock({
          'users:username:anna': {
            data: {
              id: 'u2',
              username: 'anna',
              privacy_settings: { profile_visibility: 'public' },
            },
          },
          'user_category_profiles:user_id:u2': {
            data: { profiles: { books: { enabled: true } } },
          },
        }),
      )
      .mockReturnValueOnce(
        createSupabaseMock({
          'users:username:leo': {
            data: {
              id: 'u3',
              username: 'leo',
              privacy_settings: { profile_visibility: 'public' },
            },
          },
          'user_category_profiles:user_id:u3': {
            data: null,
          },
        }),
      );
    (createRouteHandlerClient as jest.Mock).mockResolvedValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'other' } } },
        }),
      },
    });

    render(
      await PublicBacklogPage({
        params: Promise.resolve({ username: 'anna' }),
        searchParams: Promise.resolve({}),
      }),
    );
    let props = JSON.parse(screen.getByTestId('public-backlog-client').textContent ?? '{}');
    expect(props).toMatchObject({
      username: 'anna',
      defaultCategory: 'books',
      canToggleFavorite: false,
    });

    render(
      await PublicBacklogPage({
        params: Promise.resolve({ username: 'leo' }),
        searchParams: Promise.resolve({}),
      }),
    );
    props = JSON.parse(screen.getAllByTestId('public-backlog-client')[1].textContent ?? '{}');
    expect(props).toMatchObject({
      username: 'leo',
      defaultCategory: 'anime',
    });
  });

  it('renders the suspense skeleton while PublicBacklogClient is suspended', async () => {
    shouldSuspendBacklogClient = true;
    suspendPromise = new Promise<void>(resolve => {
      resolveSuspend = () => {
        shouldSuspendBacklogClient = false;
        resolve();
      };
    });
    (getSupabaseServer as jest.Mock).mockReturnValue(
      createSupabaseMock({
        'users:username:mike': {
          data: {
            id: 'u1',
            username: 'mike',
            privacy_settings: { profile_visibility: 'public' },
          },
        },
        'user_category_profiles:user_id:u1': {
          data: { profiles: { games: { enabled: true } } },
        },
      }),
    );
    (createRouteHandlerClient as jest.Mock).mockResolvedValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'other' } } },
        }),
      },
    });

    render(
      await PublicBacklogPage({
        params: Promise.resolve({ username: 'mike' }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getAllByTestId('skeleton')).toHaveLength(6);

    await act(async () => {
      resolveSuspend?.();
      await suspendPromise;
    });
    await waitFor(() => {
      expect(screen.getByTestId('public-backlog-client')).toBeInTheDocument();
    });
  });
});
