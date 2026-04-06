import { render, screen } from '@testing-library/react';
import PublicDashboardPage, {
  generateMetadata,
  revalidate,
} from '@/app/(main)/u/[username]/dashboard/page';
import getSupabaseServer from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { fetchContinueData, fetchUserStats } from '@/lib/dashboard/server-data';
import {
  DASHBOARD_TAB_CATEGORIES,
  fetchCategoryDashboardData,
} from '@/lib/dashboard/category-data';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

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

describe('u/[username]/dashboard/page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchUserStats as jest.Mock).mockResolvedValue({
      active_categories: ['books', 'invalid'],
      total_entries: 10,
    });
    (fetchContinueData as jest.Mock).mockResolvedValue({
      enabledCategories: ['games', 'invalid'],
    });
    (fetchCategoryDashboardData as jest.Mock).mockResolvedValue([{ key: 'games' }]);
  });

  it('exports metadata and revalidate', async () => {
    expect(revalidate).toBe(120);
    await expect(
      generateMetadata({ params: Promise.resolve({ username: 'mike' }) }),
    ).resolves.toMatchObject({
      title: "mike's Dashboard | Hobbistas",
      description: 'Read-only dashboard view for mike.',
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
      PublicDashboardPage({ params: Promise.resolve({ username: 'missing' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('renders private profile state when dashboard visibility is private', async () => {
    (getSupabaseServer as jest.Mock).mockReturnValue(
      createSupabaseMock({
        'users:username:mike': {
          data: {
            id: 'u1',
            username: 'mike',
            display_name: 'Mike',
            privacy_settings: { profile_visibility: 'private' },
          },
        },
      }),
    );

    render(await PublicDashboardPage({ params: Promise.resolve({ username: 'mike' }) }));

    expect(screen.getByText('Private Profile')).toBeInTheDocument();
    expect(
      screen.getByText('This dashboard is private. Ask the user for a share link.'),
    ).toBeInTheDocument();
  });

  it('renders public dashboard sections with requested categories and display name', async () => {
    (getSupabaseServer as jest.Mock).mockReturnValue(
      createSupabaseMock({
        'users:username:mike': {
          data: {
            id: 'u1',
            username: 'mike',
            display_name: 'Mike D.',
            privacy_settings: { profile_visibility: 'public' },
          },
        },
      }),
    );

    render(await PublicDashboardPage({ params: Promise.resolve({ username: 'mike' }) }));

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

  it('falls back to active categories and username when continue data is empty', async () => {
    (getSupabaseServer as jest.Mock).mockReturnValue(
      createSupabaseMock({
        'users:username:anna': {
          data: {
            id: 'u2',
            username: 'anna',
            display_name: null,
            privacy_settings: { profile_visibility: 'public' },
          },
        },
      }),
    );
    (fetchContinueData as jest.Mock).mockResolvedValueOnce({
      enabledCategories: [],
    });
    (fetchUserStats as jest.Mock).mockResolvedValueOnce({
      active_categories: ['books', 'tv', 'bad'],
      total_entries: 5,
    });
    (fetchCategoryDashboardData as jest.Mock).mockResolvedValueOnce([
      { key: 'books' },
      { key: 'tv' },
    ]);

    render(await PublicDashboardPage({ params: Promise.resolve({ username: 'anna' }) }));

    expect(fetchCategoryDashboardData).toHaveBeenCalledWith(expect.any(Object), 'u2', [
      'books',
      'tv',
    ]);
    expect(screen.getByRole('heading', { name: "anna's Dashboard" })).toBeInTheDocument();
  });

  it('passes an empty category list when neither source provides supported categories', async () => {
    (getSupabaseServer as jest.Mock).mockReturnValue(
      createSupabaseMock({
        'users:username:ivy': {
          data: {
            id: 'u4',
            username: 'ivy',
            display_name: 'Ivy',
            privacy_settings: { profile_visibility: 'public' },
          },
        },
      }),
    );
    (fetchContinueData as jest.Mock).mockResolvedValueOnce({});
    (fetchUserStats as jest.Mock).mockResolvedValueOnce({
      total_entries: 0,
    });
    (fetchCategoryDashboardData as jest.Mock).mockResolvedValueOnce([]);

    render(await PublicDashboardPage({ params: Promise.resolve({ username: 'ivy' }) }));

    expect(fetchCategoryDashboardData).toHaveBeenCalledWith(expect.any(Object), 'u4', []);
    const props = JSON.parse(screen.getByTestId('home-dashboard-sections').textContent ?? '{}');
    expect(props.mediaCategories).toEqual([]);
  });

  it('uses the expected supported dashboard categories list', () => {
    expect(DASHBOARD_TAB_CATEGORIES).toEqual(['games', 'anime', 'movies', 'tv', 'books']);
  });
});
