import { render, screen } from '@testing-library/react';
import ShareDashboardPage, {
  dynamic,
  generateMetadata,
} from '@/app/(main)/share/[token]/dashboard/page';
import getSupabaseServer from '@/lib/supabase-server';
import { fetchUserStats, fetchContinueData } from '@/lib/dashboard/server-data';
import {
  DASHBOARD_TAB_CATEGORIES,
  fetchCategoryDashboardData,
} from '@/lib/dashboard/category-data';

jest.mock('@/lib/supabase-server', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/lib/dashboard/server-data', () => ({
  __esModule: true,
  fetchUserStats: jest.fn(),
  fetchContinueData: jest.fn(),
}));

jest.mock('@/lib/dashboard/category-data', () => ({
  __esModule: true,
  DASHBOARD_TAB_CATEGORIES: ['games', 'anime', 'movies', 'tv', 'books'],
  fetchCategoryDashboardData: jest.fn(),
}));

jest.mock('@/app/components/home/HomeDashboardSections', () => ({
  __esModule: true,
  HomeDashboardSections: (props: unknown) => (
    <div data-testid="home-dashboard-sections">{JSON.stringify(props)}</div>
  ),
}));

type QueryResult = { data?: unknown; error?: unknown };

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

describe('share/[token]/dashboard/page', () => {
  const futureDate = '2099-01-01T00:00:00.000Z';
  const pastDate = '2000-01-01T00:00:00.000Z';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (fetchUserStats as jest.Mock).mockResolvedValue({
      active_categories: ['books', 'invalid'],
      total_entries: 10,
    });
    (fetchContinueData as jest.Mock).mockResolvedValue({
      enabledCategories: ['games', 'invalid'],
    });
    (fetchCategoryDashboardData as jest.Mock).mockResolvedValue([{ key: 'games' }]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exports force-dynamic rendering', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('builds invalid metadata for missing or expired tokens', async () => {
    (getSupabaseServer as jest.Mock).mockReturnValue(
      createSupabaseMock({
        'share_tokens:token:missing': { data: null },
        'share_tokens:token:expired': { data: { user_id: 'u1', expires_at: pastDate } },
      }),
    );

    await expect(
      generateMetadata({ params: Promise.resolve({ token: 'missing' }) }),
    ).resolves.toEqual({ title: 'Invalid Share Link | Hobbistas' });
    await expect(
      generateMetadata({ params: Promise.resolve({ token: 'expired' }) }),
    ).resolves.toEqual({ title: 'Invalid Share Link | Hobbistas' });
  });

  it('builds user-specific metadata for a valid token', async () => {
    (getSupabaseServer as jest.Mock).mockReturnValue(
      createSupabaseMock({
        'share_tokens:token:valid': { data: { user_id: 'u1', expires_at: futureDate } },
        'users:id:u1': { data: { username: 'mike' } },
      }),
    );

    const metadata = await generateMetadata({ params: Promise.resolve({ token: 'valid' }) });

    expect(metadata).toMatchObject({
      title: "mike's Dashboard | Hobbistas",
      description: 'Read-only dashboard shared via invite link.',
      robots: { index: false },
    });
  });

  it('falls back to generic shared metadata when the user is missing', async () => {
    (getSupabaseServer as jest.Mock).mockReturnValue(
      createSupabaseMock({
        'share_tokens:token:valid': { data: { user_id: 'u1', expires_at: futureDate } },
        'users:id:u1': { data: null },
      }),
    );

    const metadata = await generateMetadata({ params: Promise.resolve({ token: 'valid' }) });

    expect(metadata).toMatchObject({
      title: 'Shared Dashboard | Hobbistas',
      description: 'Read-only dashboard shared via invite link.',
    });
  });

  it('renders invalid link when token verification returns a DB error', async () => {
    (getSupabaseServer as jest.Mock).mockReturnValue(
      createSupabaseMock({
        'share_tokens:token:bad': { data: null, error: { message: 'db down' } },
      }),
    );

    render(await ShareDashboardPage({ params: Promise.resolve({ token: 'bad' }) }));

    expect(console.error).toHaveBeenCalledWith('[share/token/dashboard] DB error:', {
      message: 'db down',
    });
    expect(
      screen.getByText('Could not verify this share link. Please try again later.'),
    ).toBeInTheDocument();
  });

  it('renders invalid link when token is missing or expired', async () => {
    (getSupabaseServer as jest.Mock)
      .mockReturnValueOnce(
        createSupabaseMock({
          'share_tokens:token:missing': { data: null, error: null },
        }),
      )
      .mockReturnValueOnce(
        createSupabaseMock({
          'share_tokens:token:expired': {
            data: { user_id: 'u1', expires_at: pastDate },
            error: null,
          },
        }),
      );

    render(await ShareDashboardPage({ params: Promise.resolve({ token: 'missing' }) }));
    expect(screen.getByText('This share link is invalid or has been revoked.')).toBeInTheDocument();

    render(await ShareDashboardPage({ params: Promise.resolve({ token: 'expired' }) }));
    expect(screen.getAllByText('Invalid Share Link')).toHaveLength(2);
  });

  it('renders invalid link when the owner user cannot be found', async () => {
    (getSupabaseServer as jest.Mock).mockReturnValue(
      createSupabaseMock({
        'share_tokens:token:valid': {
          data: { user_id: 'u1', expires_at: futureDate },
          error: null,
        },
        'users:id:u1': { data: null },
      }),
    );

    render(await ShareDashboardPage({ params: Promise.resolve({ token: 'valid' }) }));

    expect(screen.getByText('The owner of this link could not be found.')).toBeInTheDocument();
  });

  it('renders shared dashboard sections with requested categories and display name', async () => {
    (getSupabaseServer as jest.Mock).mockReturnValue(
      createSupabaseMock({
        'share_tokens:token:valid': {
          data: { user_id: 'u1', expires_at: futureDate },
          error: null,
        },
        'users:id:u1': { data: { id: 'u1', username: 'mike', display_name: 'Mike D.' } },
      }),
    );

    render(await ShareDashboardPage({ params: Promise.resolve({ token: 'valid' }) }));

    expect(fetchUserStats).toHaveBeenCalledWith(expect.any(Object), 'u1');
    expect(fetchContinueData).toHaveBeenCalledWith(expect.any(Object), 'u1');
    expect(fetchCategoryDashboardData).toHaveBeenCalledWith(expect.any(Object), 'u1', ['games']);
    expect(screen.getByRole('heading', { name: "Mike D.'s Dashboard" })).toBeInTheDocument();

    const props = JSON.parse(screen.getByTestId('home-dashboard-sections').textContent ?? '{}');
    expect(props).toMatchObject({
      mediaCategories: ['games'],
      categorySections: [{ key: 'games' }],
      stats: { active_categories: ['books', 'invalid'], total_entries: 10 },
      isReadOnly: true,
    });
  });

  it('falls back to stats categories and username when continue data has no supported categories', async () => {
    (getSupabaseServer as jest.Mock).mockReturnValue(
      createSupabaseMock({
        'share_tokens:token:fallback': {
          data: { user_id: 'u2', expires_at: futureDate },
          error: null,
        },
        'users:id:u2': { data: { id: 'u2', username: 'anna', display_name: null } },
      }),
    );
    (fetchContinueData as jest.Mock).mockResolvedValueOnce({
      enabledCategories: ['invalid-only'],
    });
    (fetchUserStats as jest.Mock).mockResolvedValueOnce({
      active_categories: ['books', 'tv', 'bad'],
      total_entries: 5,
    });
    (fetchCategoryDashboardData as jest.Mock).mockResolvedValueOnce([
      { key: 'books' },
      { key: 'tv' },
    ]);

    render(await ShareDashboardPage({ params: Promise.resolve({ token: 'fallback' }) }));

    expect(fetchCategoryDashboardData).toHaveBeenCalledWith(expect.any(Object), 'u2', [
      'books',
      'tv',
    ]);
    expect(screen.getByRole('heading', { name: "anna's Dashboard" })).toBeInTheDocument();
  });

  it('passes an empty category list when neither continue data nor stats include supported categories', async () => {
    (getSupabaseServer as jest.Mock).mockReturnValue(
      createSupabaseMock({
        'share_tokens:token:empty-cats': {
          data: { user_id: 'u4', expires_at: futureDate },
          error: null,
        },
        'users:id:u4': { data: { id: 'u4', username: 'ivy', display_name: 'Ivy' } },
      }),
    );
    (fetchContinueData as jest.Mock).mockResolvedValueOnce({});
    (fetchUserStats as jest.Mock).mockResolvedValueOnce({
      total_entries: 0,
    });
    (fetchCategoryDashboardData as jest.Mock).mockResolvedValueOnce([]);

    render(await ShareDashboardPage({ params: Promise.resolve({ token: 'empty-cats' }) }));

    expect(fetchCategoryDashboardData).toHaveBeenCalledWith(expect.any(Object), 'u4', []);
    const props = JSON.parse(screen.getByTestId('home-dashboard-sections').textContent ?? '{}');
    expect(props.mediaCategories).toEqual([]);
  });

  it('renders generic invalid link when an unexpected error is thrown', async () => {
    (getSupabaseServer as jest.Mock).mockReturnValue(
      createSupabaseMock({
        'share_tokens:token:boom': {
          data: { user_id: 'u3', expires_at: futureDate },
          error: null,
        },
        'users:id:u3': { data: { id: 'u3', username: 'leo', display_name: null } },
      }),
    );
    (fetchUserStats as jest.Mock).mockRejectedValueOnce(new Error('stats failed'));

    render(await ShareDashboardPage({ params: Promise.resolve({ token: 'boom' }) }));

    expect(console.error).toHaveBeenCalledWith(
      '[share/token/dashboard] Unexpected error:',
      expect.any(Error),
    );
    expect(screen.getByText('Something went wrong. Please try again later.')).toBeInTheDocument();
  });

  it('uses only supported dashboard categories from the constant list', () => {
    expect(DASHBOARD_TAB_CATEGORIES).toEqual(['games', 'anime', 'movies', 'tv', 'books']);
  });
});
