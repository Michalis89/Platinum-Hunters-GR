import { render, screen } from '@testing-library/react';
import ReviewsPage, { generateMetadata } from '@/app/(main)/review/page';
import { SITE_URL } from '@/config/site';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getArticlesWithFilters } from '@/lib/supabase/queries';
import { getBreadcrumbStructuredData } from '@/utils/seo/metadata/structuredData';

jest.mock('@/app/(main)/review/ReviewsPageClient', () => ({
  __esModule: true,
  default: (props: {
    initialArticles?: unknown[];
    initialTotal?: number;
    initialCategory?: string | null;
    initialTag?: string | null;
  }) => <div data-testid="reviews-page-client">{JSON.stringify(props)}</div>,
}));

jest.mock('@/utils/seo/StructuredData', () => ({
  __esModule: true,
  default: ({ data }: { data: unknown }) => (
    <div data-testid="structured-data">{JSON.stringify(data)}</div>
  ),
}));

jest.mock('@/utils/seo/metadata/structuredData', () => ({
  __esModule: true,
  getBreadcrumbStructuredData: jest.fn(() => ({
    '@type': 'BreadcrumbList',
    itemListElement: [],
  })),
}));

jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: jest.fn(),
}));

jest.mock('@/lib/supabase/queries', () => ({
  __esModule: true,
  getArticlesWithFilters: jest.fn(),
}));

describe('review/page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createRouteHandlerClient as jest.Mock).mockResolvedValue({ supabase: true });
    (getArticlesWithFilters as jest.Mock).mockResolvedValue({
      data: [{ id: 1, title: 'Review 1' }],
      count: 9,
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('builds metadata for a valid category', async () => {
    const metadata = await generateMetadata({
      searchParams: Promise.resolve({ category: 'games' }),
    });

    expect(metadata).toMatchObject({
      title: 'Reviews for Games',
      description: 'Browse community reviews for Games on Hobbistas.',
    });
    expect(String(metadata.alternates?.canonical)).toContain('/review');
  });

  it('falls back to base metadata for invalid categories', async () => {
    const metadata = await generateMetadata({
      searchParams: Promise.resolve({ category: 'invalid' }),
    });

    expect(metadata).toMatchObject({
      title: 'Reviews',
      description:
        'Explore honest, community-written reviews across games, anime, manga, movies, TV, books, and more.',
    });
    expect(String(metadata.alternates?.canonical)).toContain('/review');
    expect(String(metadata.alternates?.canonical)).not.toContain('category=');
  });

  it('prefetches reviews, renders structured data, and passes initial props to the client', async () => {
    render(
      await ReviewsPage({
        searchParams: Promise.resolve({ category: 'games', tag: 'soulslike' }),
      }),
    );

    expect(createRouteHandlerClient).toHaveBeenCalledWith(undefined, { ignoreCookies: true });
    expect(getArticlesWithFilters).toHaveBeenCalledWith(
      { supabase: true },
      {
        category: 'games',
        topic: 'reviews',
        status: 'published',
        tag: 'soulslike',
        limit: 20,
        offset: 0,
      },
    );
    expect(getBreadcrumbStructuredData).toHaveBeenCalledWith([
      { name: 'Home', url: `${SITE_URL}/` },
      { name: 'Reviews', url: `${SITE_URL}/review` },
      { name: 'Games', url: `${SITE_URL}/review?category=games` },
    ]);

    const props = JSON.parse(screen.getByTestId('reviews-page-client').textContent ?? '{}');
    expect(props).toMatchObject({
      initialArticles: [{ id: 1, title: 'Review 1' }],
      initialTotal: 9,
      initialCategory: 'games',
      initialTag: 'soulslike',
    });
    expect(screen.getByTestId('structured-data')).toBeInTheDocument();
  });

  it('uses fallback total from article length when count is null', async () => {
    (getArticlesWithFilters as jest.Mock).mockResolvedValueOnce({
      data: [{ id: 1 }, { id: 2 }],
      count: null,
    });

    render(
      await ReviewsPage({
        searchParams: Promise.resolve({ category: 'anime' }),
      }),
    );

    const props = JSON.parse(screen.getByTestId('reviews-page-client').textContent ?? '{}');
    expect(props.initialTotal).toBe(2);
    expect(props.initialCategory).toBe('anime');
    expect(props.initialTag).toBeNull();
  });

  it('falls back to empty initial data when prefetch fails', async () => {
    (getArticlesWithFilters as jest.Mock).mockRejectedValueOnce(new Error('db down'));

    render(
      await ReviewsPage({
        searchParams: Promise.resolve({ category: 'invalid', tag: 'retro' }),
      }),
    );

    expect(console.error).toHaveBeenCalledWith(
      'Failed to prefetch reviews for SSR:',
      expect.any(Error),
    );
    expect(getBreadcrumbStructuredData).toHaveBeenCalledWith([
      { name: 'Home', url: `${SITE_URL}/` },
      { name: 'Reviews', url: `${SITE_URL}/review` },
    ]);

    const props = JSON.parse(screen.getByTestId('reviews-page-client').textContent ?? '{}');
    expect(props).toMatchObject({
      initialArticles: [],
      initialTotal: 0,
      initialCategory: null,
      initialTag: 'retro',
    });
  });

  it('falls back to an empty article array when the query returns null data', async () => {
    (getArticlesWithFilters as jest.Mock).mockResolvedValueOnce({
      data: null,
      count: 0,
    });

    render(
      await ReviewsPage({
        searchParams: Promise.resolve({}),
      }),
    );

    const props = JSON.parse(screen.getByTestId('reviews-page-client').textContent ?? '{}');
    expect(props.initialArticles).toEqual([]);
    expect(props.initialTotal).toBe(0);
  });
});
