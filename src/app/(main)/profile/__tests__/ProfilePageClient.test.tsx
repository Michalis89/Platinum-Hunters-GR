import { render, screen, waitFor } from '@testing-library/react';
import ProfilePageClient from '@/app/(main)/profile/ProfilePageClient';
import { useSelector } from 'react-redux';
import { useUserSettings } from '@/lib/settings/useUserSettings';
import { hasAnyRole } from '@/lib/roles';
import { supabase } from '@/lib/supabase-client';
import { getEnabledCategories, resolveProfileIdentity } from '@/app/components/profile/profileData';

const profileHeroMock = jest.fn(
  ({
    stats,
    loadingStats,
    identity,
  }: {
    stats: {
      articles: number | null;
      reviews: number | null;
      entries: number | null;
    };
    loadingStats: boolean;
    identity: { displayName: string } | null;
  }) => (
    <div data-testid="profile-hero">
      <span>{`articles:${String(stats.articles)}`}</span>
      <span>{`reviews:${String(stats.reviews)}`}</span>
      <span>{`entries:${String(stats.entries)}`}</span>
      <span>{`loading:${String(loadingStats)}`}</span>
      <span>{`identity:${identity?.displayName ?? 'none'}`}</span>
    </div>
  ),
);

const hobbySectionMock = jest.fn(
  ({
    categories,
    categoryProfile,
    showPsnId,
  }: {
    categories: string[];
    categoryProfile: Record<string, unknown> | null;
    showPsnId: boolean;
  }) => (
    <div data-testid="hobby-section">
      <span>{`categories:${categories.join('|')}`}</span>
      <span>{`showPsnId:${String(showPsnId)}`}</span>
      <pre data-testid="hobby-category-profile">{JSON.stringify(categoryProfile ?? null)}</pre>
    </div>
  ),
);

const aboutSectionMock = jest.fn(({ identity }: { identity: { displayName: string } | null }) => (
  <div data-testid="about-section">{identity?.displayName ?? 'none'}</div>
));

const genreAffinityMock = jest.fn(
  ({ genreAffinity }: { genreAffinity?: Record<string, string[]> | null }) => (
    <div data-testid="genre-affinity">{JSON.stringify(genreAffinity ?? null)}</div>
  ),
);

const accountInfoMock = jest.fn(({ identity }: { identity: { displayName: string } | null }) => (
  <div data-testid="account-info">{identity?.displayName ?? 'none'}</div>
));

const activityTimelineMock = jest.fn(() => <div data-testid="activity-timeline" />);
const contentListMock = jest.fn(() => <div data-testid="content-list" />);

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: jest.fn((loader: () => Promise<unknown>) => {
    const source = loader.toString();
    if (source.includes('ActivityTimeline')) {
      return function MockActivityTimeline() {
        return activityTimelineMock();
      };
    }
    if (source.includes('ContentList')) {
      return function MockContentList() {
        return contentListMock();
      };
    }
    return function UnknownDynamicComponent() {
      return null;
    };
  }),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('@/store/slices/authSlice', () => ({
  __esModule: true,
  selectUser: jest.fn(),
}));

jest.mock('@/lib/settings/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

jest.mock('@/lib/roles', () => ({
  hasAnyRole: jest.fn(),
}));

jest.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
  },
}));

jest.mock('@/components/ui/skeleton', () => ({
  __esModule: true,
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" data-class={className} />
  ),
}));

jest.mock('@/app/components/profile', () => ({
  __esModule: true,
  ProfileHero: (props: {
    stats: {
      articles: number | null;
      reviews: number | null;
      entries: number | null;
    };
    loadingStats: boolean;
    identity: { displayName: string } | null;
  }) => profileHeroMock(props),
  HobbySection: (props: {
    categories: string[];
    categoryProfile: Record<string, unknown> | null;
    showPsnId: boolean;
  }) => hobbySectionMock(props),
  AboutSection: (props: { identity: { displayName: string } | null }) => aboutSectionMock(props),
  GenreAffinity: (props: { genreAffinity?: Record<string, string[]> | null }) =>
    genreAffinityMock(props),
  AccountInfo: (props: { identity: { displayName: string } | null }) => accountInfoMock(props),
}));

jest.mock('@/app/components/profile/profileData', () => ({
  getEnabledCategories: jest.fn(),
  resolveProfileIdentity: jest.fn(),
}));

type MockUser = {
  username: string;
  display_name?: string | null;
  category_profile?: Record<string, unknown> | null;
  genre_affinity?: Record<string, string[]> | null;
  privacy_settings?: {
    show_psn_id?: boolean;
  } | null;
  roles?: string[] | null;
};

function createUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    username: 'mike',
    display_name: 'Mike',
    category_profile: {
      movies: { favorite_genres: ['Sci-Fi'] },
      tv: { favorite_genres: ['Mystery'] },
      books: { subtitle: 'Author Three, Author Four' },
      anime: { favorite_genres: ['Shonen'] },
      manga: { favorite_genres: ['Seinen'] },
    },
    genre_affinity: {
      games: ['RPG'],
    },
    privacy_settings: {
      show_psn_id: true,
    },
    roles: ['user'],
    ...overrides,
  };
}

function jsonResponse(body: unknown, ok = true): Promise<Response> {
  return Promise.resolve({
    ok,
    json: async () => body,
  } as Response);
}

describe('ProfilePageClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSelector as jest.Mock).mockReturnValue(createUser());
    (useUserSettings as jest.Mock).mockReturnValue({
      settings: { social_enabled: true },
    });
    (hasAnyRole as jest.Mock).mockReturnValue(false);
    (getEnabledCategories as jest.Mock).mockReturnValue([
      'movies',
      'tv',
      'books',
      'anime',
      'manga',
    ]);
    (resolveProfileIdentity as jest.Mock).mockReturnValue({
      displayName: 'Resolved Mike',
      username: 'mike',
      fullName: 'Mike',
      email: 'mike@example.com',
      memberSince: null,
      lastLogin: null,
      emailVerified: true,
    });
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'auth-user',
          email: 'mike@example.com',
        },
      },
    });

    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/articles?author_id=me&status=published&topic=articles')) {
        return jsonResponse({ meta: { total: 12 } });
      }
      if (url.includes('/api/articles?author_id=me&status=published&topic=reviews')) {
        return jsonResponse({ meta: { total: 5 } });
      }
      if (url === '/api/user/stats') {
        return jsonResponse({ data: { total_backlog: 27 } });
      }
      if (url === '/api/movies/library?category=movies') {
        return jsonResponse({
          items: [
            {
              status: 'completed',
              isFavorite: true,
              score: '9.5',
              totalRuntime: 200,
              externalId: 101,
            },
            {
              status: 'planning',
              isFavorite: false,
              score: '8.0',
              totalRuntime: 120,
              externalId: 999,
            },
            {
              status: 'completed',
              isFavorite: false,
              score: null,
              totalRuntime: 95,
            },
          ],
        });
      }
      if (url === '/api/movies/library?category=tv') {
        return jsonResponse({
          items: [
            {
              status: 'completed',
              isFavorite: false,
              score: '8.0',
              totalRuntime: 60,
              externalId: '202',
            },
          ],
        });
      }
      if (url === '/api/books/library?category=books') {
        return jsonResponse({
          items: [
            {
              status: 'completed',
              isFavorite: false,
              score: '7.0',
              authors: [],
              subtitle: ' Author One , Author Two ',
            },
            {
              status: 'completed',
              isFavorite: false,
              score: null,
              authors: ['Null Score Author'],
            },
            {
              status: 'planned',
              isFavorite: false,
              score: '9.0',
              authors: ['Should Skip'],
            },
          ],
        });
      }
      if (url === '/api/anime/library?category=anime') {
        return jsonResponse({
          items: [
            {
              status: 'completed',
              isFavorite: false,
              score: '10.0',
              studios: [' Bones ', 'MAPPA', '   '],
            },
            {
              status: 'completed',
              isFavorite: false,
              score: '6.0',
              studios: ['Low Score Studio'],
            },
            {
              status: 'paused',
              isFavorite: false,
              score: '8.0',
              studios: ['Skipped Studio'],
            },
          ],
        });
      }
      if (url === '/api/anime/library?category=manga') {
        return jsonResponse({
          items: [
            {
              status: 'completed',
              isFavorite: false,
              score: '8.0',
              authors: ['Author M', ' Author N ', '   '],
            },
            {
              status: 'completed',
              isFavorite: false,
              score: '6.0',
              authors: ['Low Score Mangaka'],
            },
            {
              status: 'dropped',
              isFavorite: false,
              score: '9.0',
              authors: ['Skipped Mangaka'],
            },
          ],
        });
      }
      if (url === '/api/movies/credits?category=movies&tmdb_id=101') {
        return jsonResponse({
          directors: [' Denis Villeneuve ', 'Christopher Nolan', '   '],
          actors: [' Amy Adams ', 'Ryan Gosling', '   '],
        });
      }
      if (url === '/api/movies/credits?category=tv&tmdb_id=202') {
        return jsonResponse({
          directors: ['Vince Gilligan'],
          actors: ['Bob Odenkirk'],
        });
      }
      return jsonResponse({}, false);
    }) as jest.Mock;

    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders skeleton layout when there is no signed-in user', () => {
    (useSelector as jest.Mock).mockReturnValue(null);

    render(<ProfilePageClient />);

    expect(screen.getAllByTestId('skeleton')).toHaveLength(7);
    expect(profileHeroMock).not.toHaveBeenCalled();
  });

  it('renders profile sections, loads stats, and resolves identity', async () => {
    render(<ProfilePageClient />);

    await waitFor(() => {
      expect(screen.getByText('articles:12')).toBeInTheDocument();
    });

    expect(screen.getByText('reviews:5')).toBeInTheDocument();
    expect(screen.getByText('entries:27')).toBeInTheDocument();
    expect(screen.getByText('loading:false')).toBeInTheDocument();
    expect(screen.getByText('identity:Resolved Mike')).toBeInTheDocument();
    expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
    expect(screen.queryByTestId('content-list')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('about-section')).toHaveLength(2);
    expect(screen.getAllByTestId('genre-affinity')).toHaveLength(2);
    expect(screen.getAllByTestId('account-info')).toHaveLength(2);
    expect(screen.getByText('categories:movies|tv|books|anime|manga')).toBeInTheDocument();
    expect(screen.getByText('showPsnId:true')).toBeInTheDocument();

    const categoryProfile = JSON.parse(
      screen.getByTestId('hobby-category-profile').textContent ?? 'null',
    );
    expect(categoryProfile.movies).toMatchObject({ favorite_genres: ['Sci-Fi'] });
    expect(categoryProfile.tv).toMatchObject({ favorite_genres: ['Mystery'] });
    expect(categoryProfile.books).toMatchObject({ subtitle: 'Author Three, Author Four' });
    expect(categoryProfile.anime).toMatchObject({ favorite_genres: ['Shonen'] });
    expect(categoryProfile.manga).toMatchObject({ favorite_genres: ['Seinen'] });

    expect(resolveProfileIdentity).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'mike' }),
      expect.objectContaining({ id: 'auth-user' }),
    );
  });

  it('renders privileged content list and respects disabled social layer and psn privacy fallback', async () => {
    (hasAnyRole as jest.Mock).mockReturnValue(true);
    (useUserSettings as jest.Mock).mockReturnValue({
      settings: { social_enabled: false },
    });
    (useSelector as jest.Mock).mockReturnValue(
      createUser({
        privacy_settings: null,
      }),
    );
    (getEnabledCategories as jest.Mock).mockReturnValue(['movies']);

    render(<ProfilePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId('content-list')).toBeInTheDocument();
    });

    expect(getEnabledCategories).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'mike' }),
      true,
      false,
    );
    expect(screen.getByText('showPsnId:true')).toBeInTheDocument();
  });

  it('falls back cleanly when stats, auth lookup, and favorites insight requests fail', async () => {
    (supabase.auth.getUser as jest.Mock).mockRejectedValueOnce(new Error('auth failed'));
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/articles?author_id=me&status=published&topic=articles')) {
        return Promise.reject(new Error('stats failed'));
      }
      if (url === '/api/movies/library?category=movies') {
        return jsonResponse({
          items: [
            {
              status: 'completed',
              isFavorite: false,
              score: 'bad-score',
              totalRuntime: 181,
              externalId: 'not-a-number',
            },
            {
              status: 'completed',
              isFavorite: false,
              score: null,
              totalRuntime: 100,
              externalId: 55,
            },
          ],
        });
      }
      if (url === '/api/movies/credits?category=movies&tmdb_id=55') {
        return jsonResponse({}, false);
      }
      return Promise.reject(new Error(`unexpected ${url}`));
    });
    (getEnabledCategories as jest.Mock).mockReturnValue(['movies']);

    render(<ProfilePageClient />);

    await waitFor(() => {
      expect(screen.getByText('loading:false')).toBeInTheDocument();
    });

    expect(screen.getByText('articles:null')).toBeInTheDocument();
    expect(screen.getByText('reviews:null')).toBeInTheDocument();

    const categoryProfile = JSON.parse(
      screen.getByTestId('hobby-category-profile').textContent ?? 'null',
    );
    expect(categoryProfile.movies).toEqual({ favorite_genres: ['Sci-Fi'] });
    expect(console.warn).not.toHaveBeenCalled();
    expect(resolveProfileIdentity).toHaveBeenCalledWith(expect.any(Object), null);
  });

  it('resets auth and favorites insight state immediately when the user disappears', async () => {
    let currentUser: MockUser | null = createUser();
    (useSelector as jest.Mock).mockImplementation(() => currentUser);

    const { rerender } = render(<ProfilePageClient />);

    await waitFor(() => {
      expect(screen.getByText('identity:Resolved Mike')).toBeInTheDocument();
    });

    currentUser = null;
    rerender(<ProfilePageClient />);

    await waitFor(() => {
      expect(screen.getAllByTestId('skeleton')).toHaveLength(7);
    });
  });

  it('keeps profile category data stable when unrelated requests fail', async () => {
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/articles?author_id=me&status=published&topic=articles')) {
        return jsonResponse({ meta: { total: 1 } });
      }
      if (url.includes('/api/articles?author_id=me&status=published&topic=reviews')) {
        return jsonResponse({ meta: { total: 2 } });
      }
      return jsonResponse({}, false);
    });

    render(<ProfilePageClient />);

    await waitFor(() => {
      expect(screen.getByText('articles:1')).toBeInTheDocument();
    });

    const categoryProfile = JSON.parse(
      screen.getByTestId('hobby-category-profile').textContent ?? 'null',
    );
    expect(categoryProfile.movies).toEqual({ favorite_genres: ['Sci-Fi'] });
  });

  it('keeps existing profile data when a library endpoint responds with a non-ok response', async () => {
    (getEnabledCategories as jest.Mock).mockReturnValue(['tv']);
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/articles?author_id=me&status=published&topic=articles')) {
        return jsonResponse({ meta: { total: 3 } });
      }
      if (url.includes('/api/articles?author_id=me&status=published&topic=reviews')) {
        return jsonResponse({ meta: { total: 4 } });
      }
      if (url === '/api/movies/library?category=tv') {
        return jsonResponse({}, false);
      }
      return jsonResponse({}, false);
    });

    render(<ProfilePageClient />);

    await waitFor(() => {
      expect(screen.getByText('articles:3')).toBeInTheDocument();
    });

    const categoryProfile = JSON.parse(
      screen.getByTestId('hobby-category-profile').textContent ?? 'null',
    );
    expect(categoryProfile.tv).toEqual({ favorite_genres: ['Mystery'] });
  });

  it('preserves category payload when base value is non-object', async () => {
    (useSelector as jest.Mock).mockReturnValue(
      createUser({
        category_profile: {
          movies: 'legacy',
        },
      }),
    );
    (getEnabledCategories as jest.Mock).mockReturnValue(['movies']);
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/articles?author_id=me&status=published&topic=articles')) {
        return jsonResponse({ meta: { total: 7 } });
      }
      if (url.includes('/api/articles?author_id=me&status=published&topic=reviews')) {
        return jsonResponse({ meta: { total: 6 } });
      }
      if (url === '/api/movies/library?category=movies') {
        return jsonResponse({
          items: [
            {
              status: 'completed',
              isFavorite: true,
              score: '9.0',
              totalRuntime: 210,
              externalId: 303,
            },
          ],
        });
      }
      if (url === '/api/movies/credits?category=movies&tmdb_id=303') {
        return jsonResponse({
          directors: ['Patty Jenkins'],
          actors: ['Gal Gadot'],
        });
      }
      return jsonResponse({}, false);
    });

    render(<ProfilePageClient />);

    await waitFor(() => {
      expect(screen.getByText('articles:7')).toBeInTheDocument();
    });

    const categoryProfile = JSON.parse(
      screen.getByTestId('hobby-category-profile').textContent ?? 'null',
    );
    expect(categoryProfile.movies).toEqual('legacy');
  });

  it('covers partial payload fallbacks for stats, auth, and optional insight fields', async () => {
    (useUserSettings as jest.Mock).mockReturnValue({
      settings: {},
    });
    (useSelector as jest.Mock).mockReturnValue(
      createUser({
        category_profile: null,
        privacy_settings: { show_psn_id: false },
      }),
    );
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: {
        user: null,
      },
    });
    (getEnabledCategories as jest.Mock).mockReturnValue([
      'movies',
      'tv',
      'books',
      'anime',
      'manga',
    ]);
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/articles?author_id=me&status=published&topic=articles')) {
        return jsonResponse({}, false);
      }
      if (url.includes('/api/articles?author_id=me&status=published&topic=reviews')) {
        return jsonResponse({}, false);
      }
      if (url === '/api/movies/library?category=movies') {
        return jsonResponse({
          items: [
            {
              status: 'completed',
              isFavorite: false,
              score: '9.0',
              totalRuntime: 181,
              externalId: 404,
            },
          ],
        });
      }
      if (url === '/api/movies/library?category=tv') {
        return jsonResponse({
          items: [
            {
              status: 'completed',
              isFavorite: false,
              score: '8.0',
              totalRuntime: 60,
              externalId: '505',
            },
          ],
        });
      }
      if (url === '/api/books/library?category=books') {
        return jsonResponse({
          items: [
            {
              status: 'completed',
              isFavorite: false,
              score: 'bad-score',
              authors: [],
            },
          ],
        });
      }
      if (url === '/api/anime/library?category=anime') {
        return jsonResponse({
          items: [
            {
              status: 'completed',
              isFavorite: false,
              score: '8.0',
              studios: [],
            },
          ],
        });
      }
      if (url === '/api/anime/library?category=manga') {
        return jsonResponse({
          items: {},
        });
      }
      if (url === '/api/movies/credits?category=movies&tmdb_id=404') {
        return jsonResponse({
          directors: ['Director Only'],
        });
      }
      if (url === '/api/movies/credits?category=tv&tmdb_id=505') {
        return jsonResponse({
          actors: ['Actor Only'],
        });
      }
      return jsonResponse({}, false);
    });

    render(<ProfilePageClient />);

    await waitFor(() => {
      expect(screen.getByText('articles:0')).toBeInTheDocument();
    });

    expect(screen.getByText('reviews:0')).toBeInTheDocument();
    expect(screen.getByText('showPsnId:false')).toBeInTheDocument();

    const categoryProfile = JSON.parse(
      screen.getByTestId('hobby-category-profile').textContent ?? 'null',
    );
    expect(categoryProfile).toBeNull();

    expect(resolveProfileIdentity).toHaveBeenCalledWith(expect.any(Object), null);
  });

  it('avoids state updates after the stats request is cancelled on unmount', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let resolveArticles: ((value: Response) => void) | null = null;
    let resolveReviews: ((value: Response) => void) | null = null;
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/articles?author_id=me&status=published&topic=articles')) {
        return new Promise<Response>(resolve => {
          resolveArticles = resolve;
        });
      }
      if (url.includes('/api/articles?author_id=me&status=published&topic=reviews')) {
        return new Promise<Response>(resolve => {
          resolveReviews = resolve;
        });
      }
      return jsonResponse({}, false);
    });

    const { unmount } = render(<ProfilePageClient />);
    unmount();

    await Promise.all([
      Promise.resolve().then(() =>
        resolveArticles?.({
          ok: true,
          json: async () => ({ meta: { total: 9 } }),
        } as Response),
      ),
      Promise.resolve().then(() =>
        resolveReviews?.({
          ok: true,
          json: async () => ({ meta: { total: 8 } }),
        } as Response),
      ),
    ]);

    expect(resolveArticles).not.toBeNull();
    expect(resolveReviews).not.toBeNull();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
