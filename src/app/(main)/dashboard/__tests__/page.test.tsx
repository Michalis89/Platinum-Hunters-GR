import { render } from '@testing-library/react';
import DashboardPage, { metadata, revalidate } from '@/app/(main)/dashboard/page';
import {
  DashboardContentSkeleton,
  DashboardData,
  DashboardSectionsData,
  DashboardSectionsSkeleton,
} from '@/app/(main)/dashboard/dashboardPageContent';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { fetchContinueData, fetchUserStats } from '@/lib/dashboard/server-data';
import { fetchCategoryDashboardData } from '@/lib/dashboard/category-data';
import { redirect } from 'next/navigation';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: jest.fn(),
}));

jest.mock('@/lib/dashboard/server-data', () => ({
  __esModule: true,
  fetchUserStats: jest.fn(),
  fetchContinueData: jest.fn(),
}));

jest.mock('@/lib/dashboard/category-data', () => ({
  __esModule: true,
  DASHBOARD_TAB_CATEGORIES: ['games', 'anime', 'manga', 'movies', 'tv', 'books'],
  fetchCategoryDashboardData: jest.fn(),
}));

jest.mock('@/components/ui/skeleton', () => ({
  __esModule: true,
  Skeleton: () => <div data-testid="skeleton" />,
}));

jest.mock('@/app/components/layout', () => ({
  __esModule: true,
  PageContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-container">{children}</div>
  ),
}));

jest.mock('@/app/components/home/HomeDashboardContent', () => ({
  __esModule: true,
  default: ({
    username,
    displayName,
    mediaCategories,
  }: {
    username: string;
    displayName: string | null;
    mediaCategories: string[];
  }) => (
    <div data-testid="home-dashboard-content">
      <span>{`username:${username}`}</span>
      <span>{`displayName:${String(displayName)}`}</span>
      <span>{`mediaCategories:${mediaCategories.join(',')}`}</span>
    </div>
  ),
}));

jest.mock('@/app/components/home/HomeDashboardSections', () => ({
  __esModule: true,
  HomeDashboardSections: ({ mediaCategories }: { mediaCategories: string[] }) => {
    return <div data-testid="home-dashboard-sections">{mediaCategories.join(',')}</div>;
  },
}));

type SessionUser = {
  id: string;
  user_metadata?: Record<string, unknown>;
};

function mockSupabase(sessionUser: SessionUser | null) {
  (createRouteHandlerClient as jest.Mock).mockResolvedValue({
    auth: {
      getSession: async () => ({
        data: {
          session: sessionUser ? { user: sessionUser } : null,
        },
      }),
    },
  });
}

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase({
      id: 'user-1',
      user_metadata: { username: 'john', display_name: 'John' },
    });
    (fetchUserStats as jest.Mock).mockResolvedValue({
      active_categories: ['books'],
    });
    (fetchContinueData as jest.Mock).mockResolvedValue({
      enabledCategories: ['games', 'invalid-category'],
    });
    (fetchCategoryDashboardData as jest.Mock).mockResolvedValue({});
  });

  it('exports metadata and revalidate', () => {
    expect(revalidate).toBe(300);
    expect(metadata).toMatchObject({
      title: 'Dashboard',
      description:
        'Personal dashboard for managing your backlog, tracking progress, and exploring tailored suggestions.',
      robots: { index: false, follow: false },
    });
  });

  it('renders structured data and dashboard content with requested categories', async () => {
    const result = (await DashboardData()) as unknown as {
      props: { children: Array<{ props: Record<string, unknown> }> };
    };

    const contentElement = result.props.children[0];
    expect(contentElement.props).toMatchObject({
      username: 'john',
      displayName: 'John',
      mediaCategories: ['games'],
    });
  });

  it('falls back to active_categories when enabledCategories are empty', async () => {
    (fetchContinueData as jest.Mock).mockResolvedValue({
      enabledCategories: [],
    });
    (fetchUserStats as jest.Mock).mockResolvedValue({
      active_categories: ['movies', 'invalid'],
    });

    const result = (await DashboardData()) as unknown as {
      props: { children: Array<{ props: Record<string, unknown> }> };
    };

    const contentElement = result.props.children[0];
    expect(contentElement.props).toMatchObject({
      mediaCategories: ['movies'],
    });
  });

  it('returns null sections when media categories are empty', async () => {
    (fetchContinueData as jest.Mock).mockResolvedValue({
      enabledCategories: [],
    });
    (fetchUserStats as jest.Mock).mockResolvedValue({
      active_categories: [],
    });

    const result = (await DashboardData()) as unknown as {
      props: { children: Array<{ props: Record<string, unknown> }> };
    };

    const contentElement = result.props.children[0];
    expect(contentElement.props).toMatchObject({
      mediaCategories: [],
    });
    expect(fetchCategoryDashboardData).not.toHaveBeenCalled();
  });

  it('renders sections skeleton fallback when sections are suspended', async () => {
    render(<DashboardSectionsSkeleton />);
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders dashboard content skeleton', () => {
    render(<DashboardContentSkeleton />);
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('returns null from DashboardSectionsData when there are no categories', async () => {
    const result = await DashboardSectionsData({
      supabase: {} as Awaited<ReturnType<typeof createRouteHandlerClient>>,
      userId: 'user-1',
      mediaCategories: [],
      stats: {
        active_categories: [],
      } as unknown as import('@/app/components/home/types').PersonalStats,
    });

    expect(result).toBeNull();
    expect(fetchCategoryDashboardData).not.toHaveBeenCalled();
  });

  it('returns HomeDashboardSections when DashboardSectionsData has categories', async () => {
    const stats = {
      active_categories: ['games'],
    } as unknown as import('@/app/components/home/types').PersonalStats;
    (fetchCategoryDashboardData as jest.Mock).mockResolvedValue({
      games: { featured: null, suggestions: [] },
    });

    const result = (await DashboardSectionsData({
      supabase: {} as Awaited<ReturnType<typeof createRouteHandlerClient>>,
      userId: 'user-1',
      mediaCategories: ['games'],
      stats,
    })) as unknown as { props: Record<string, unknown> };

    expect(fetchCategoryDashboardData).toHaveBeenCalledWith(expect.any(Object), 'user-1', [
      'games',
    ]);
    expect(result.props).toMatchObject({
      mediaCategories: ['games'],
      stats,
    });
  });

  it('redirects to login when session is missing', async () => {
    (createRouteHandlerClient as jest.Mock).mockResolvedValue({
      auth: {
        getSession: async () => ({
          data: { session: null },
        }),
      },
    });
    (redirect as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(DashboardData()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/auth/login');
  });

  it('uses default username and displayName fallback values when metadata is missing', async () => {
    mockSupabase({
      id: 'user-2',
      user_metadata: {},
    });
    (fetchContinueData as jest.Mock).mockResolvedValue({
      enabledCategories: undefined,
    });
    (fetchUserStats as jest.Mock).mockResolvedValue({
      active_categories: undefined,
    });

    const result = (await DashboardData()) as unknown as {
      props: { children: Array<{ props: Record<string, unknown> }> };
    };

    const contentElement = result.props.children[0];
    expect(contentElement.props).toMatchObject({
      username: 'User',
      displayName: null,
      mediaCategories: [],
    });
  });

  it('renders DashboardPage shell wrapper', () => {
    const pageElement = DashboardPage() as unknown as {
      props: { children: Array<{ props?: Record<string, unknown> }> };
    };
    const children = pageElement.props.children;
    expect(children[0]).toMatchObject({
      type: 'h1',
      props: expect.objectContaining({ children: 'Dashboard' }),
    });
  });
});
