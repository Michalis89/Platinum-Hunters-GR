import { render, screen } from '@testing-library/react';
import ExplorePage, { metadata } from '@/app/(main)/explore/page';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getUserSettings } from '@/lib/settings';
import { fetchUserStats } from '@/lib/dashboard/server-data';
import { redirect } from 'next/navigation';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: jest.fn(),
}));

jest.mock('@/lib/settings', () => ({
  __esModule: true,
  getUserSettings: jest.fn(),
}));

jest.mock('@/lib/dashboard/server-data', () => ({
  __esModule: true,
  fetchUserStats: jest.fn(),
}));

jest.mock('@/app/components/layout', () => ({
  __esModule: true,
  PageContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-container">{children}</div>
  ),
}));

jest.mock('@/app/components/layout/PageHeader', () => ({
  __esModule: true,
  PageHeader: ({ title, description }: { title: string; description: string }) => (
    <header>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  ),
}));

jest.mock('@/app/components/home/HomeSocialSection', () => ({
  __esModule: true,
  HomeSocialSection: ({
    enabledCategories,
    showSuggestions,
    showActivity,
  }: {
    enabledCategories: string[];
    showSuggestions: boolean;
    showActivity: boolean;
  }) => (
    <div data-testid="home-social-section">
      <span>{`enabled:${enabledCategories.join(',')}`}</span>
      <span>{`suggestions:${String(showSuggestions)}`}</span>
      <span>{`activity:${String(showActivity)}`}</span>
    </div>
  ),
}));

function mockSession(session: { user: { id: string } } | null) {
  (createRouteHandlerClient as jest.Mock).mockResolvedValue({
    auth: {
      getSession: async () => ({
        data: { session },
      }),
    },
  });
}

describe('ExplorePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports expected metadata', () => {
    expect(metadata).toMatchObject({
      title: 'Explore',
      description: 'Discover what the community is enjoying',
      robots: { index: false, follow: false },
    });
  });

  it('redirects to login when unauthenticated', async () => {
    mockSession(null);
    (redirect as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(ExplorePage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/auth/login');
  });

  it('redirects to settings when social profile is disabled', async () => {
    mockSession({ user: { id: 'u1' } });
    (getUserSettings as jest.Mock).mockResolvedValue({
      social_profile_enabled: false,
      community_suggestions_enabled: true,
      community_activity_enabled: true,
    });
    (redirect as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(ExplorePage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/settings');
  });

  it('renders explore page with filtered categories and suggestions/activity flags', async () => {
    mockSession({ user: { id: 'u1' } });
    (getUserSettings as jest.Mock).mockResolvedValue({
      social_profile_enabled: true,
      community_suggestions_enabled: true,
      community_activity_enabled: false,
    });
    (fetchUserStats as jest.Mock).mockResolvedValue({
      active_categories: ['games', 'invalid', 'anime'],
    });

    render(await ExplorePage());

    expect(screen.getByTestId('page-container')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Explore' })).toBeInTheDocument();
    expect(screen.getByText('enabled:games,anime')).toBeInTheDocument();
    expect(screen.getByText('suggestions:true')).toBeInTheDocument();
    expect(screen.getByText('activity:false')).toBeInTheDocument();
  });

  it('disables suggestions when no valid categories are available', async () => {
    mockSession({ user: { id: 'u2' } });
    (getUserSettings as jest.Mock).mockResolvedValue({
      social_profile_enabled: true,
      community_suggestions_enabled: true,
      community_activity_enabled: true,
    });
    (fetchUserStats as jest.Mock).mockResolvedValue({
      active_categories: ['invalid'],
    });

    render(await ExplorePage());

    expect(screen.getByText('enabled:')).toBeInTheDocument();
    expect(screen.getByText('suggestions:false')).toBeInTheDocument();
    expect(screen.getByText('activity:true')).toBeInTheDocument();
  });

  it('handles missing active_categories with nullish fallback', async () => {
    mockSession({ user: { id: 'u3' } });
    (getUserSettings as jest.Mock).mockResolvedValue({
      social_profile_enabled: true,
      community_suggestions_enabled: false,
      community_activity_enabled: false,
    });
    (fetchUserStats as jest.Mock).mockResolvedValue({});

    render(await ExplorePage());

    expect(screen.getByText('enabled:')).toBeInTheDocument();
    expect(screen.getByText('suggestions:false')).toBeInTheDocument();
    expect(screen.getByText('activity:false')).toBeInTheDocument();
  });
});
