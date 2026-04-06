import { render, screen } from '@testing-library/react';
import BacklogPage, { generateMetadata, revalidate } from '@/app/(main)/backlog/page';
import { requireServerAuth } from '@/lib/auth/requireServerAuth';
import { getBreadcrumbStructuredData } from '@/utils/seo/metadata/structuredData';
import { SITE_URL } from '@/config/site';

jest.mock('@/lib/auth/requireServerAuth', () => ({
  __esModule: true,
  requireServerAuth: jest.fn(),
}));

let shouldSuspendBacklogClient = false;

jest.mock('@/app/(main)/backlog/BacklogPageClient', () => ({
  __esModule: true,
  default: () => {
    if (shouldSuspendBacklogClient) {
      throw new Promise(() => {});
    }
    return <div data-testid="backlog-page-client" />;
  },
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

jest.mock('@/components/ui/skeleton', () => ({
  __esModule: true,
  Skeleton: () => <div data-testid="skeleton" />,
}));

describe('BacklogPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    shouldSuspendBacklogClient = false;
    (requireServerAuth as jest.Mock).mockResolvedValue({ user: { id: 'u1' } });
  });

  it('exports revalidate interval', () => {
    expect(revalidate).toBe(300);
  });

  it('generates metadata for recognized category', async () => {
    const metadata = await generateMetadata({
      searchParams: Promise.resolve({ category: 'games' }),
    });

    expect(metadata).toMatchObject({
      title: 'Backlog for Games',
      description: 'Organize your Games backlog with goals, notes, and progress tracking.',
    });
  });

  it('generates default metadata for unknown category', async () => {
    const metadata = await generateMetadata({
      searchParams: Promise.resolve({ category: 'unknown' }),
    });

    expect(metadata).toMatchObject({
      title: 'Backlog & Progress',
      description: 'Organize your backlog with goals, progress tracking, and per-hobby insights.',
    });
  });

  it('generates default metadata when category is missing', async () => {
    const metadata = await generateMetadata({
      searchParams: Promise.resolve({}),
    });

    expect(metadata).toMatchObject({
      title: 'Backlog & Progress',
      description: 'Organize your backlog with goals, progress tracking, and per-hobby insights.',
    });
  });

  it('requires auth, renders breadcrumb with category and client page', async () => {
    render(
      await BacklogPage({
        searchParams: Promise.resolve({ category: 'games' }),
      }),
    );

    expect(requireServerAuth).toHaveBeenCalledWith('/backlog?category=games');
    expect(getBreadcrumbStructuredData).toHaveBeenCalledWith([
      { name: 'Home', url: `${SITE_URL}/` },
      { name: 'Backlog', url: `${SITE_URL}/backlog` },
      { name: 'Games', url: `${SITE_URL}/backlog?category=games` },
    ]);
    expect(screen.getByTestId('structured-data')).toBeInTheDocument();
    expect(screen.getByTestId('backlog-page-client')).toBeInTheDocument();
  });

  it('normalizes category and uses base breadcrumb when category is unsupported', async () => {
    render(
      await BacklogPage({
        searchParams: Promise.resolve({ category: 'UNKNOWN' }),
      }),
    );

    expect(requireServerAuth).toHaveBeenCalledWith('/backlog?category=unknown');
    expect(getBreadcrumbStructuredData).toHaveBeenCalledWith([
      { name: 'Home', url: `${SITE_URL}/` },
      { name: 'Backlog', url: `${SITE_URL}/backlog` },
    ]);
  });

  it('renders shell skeleton when client component is suspended', async () => {
    shouldSuspendBacklogClient = true;

    render(
      await BacklogPage({
        searchParams: Promise.resolve({ category: 'games' }),
      }),
    );

    expect(screen.getAllByTestId('skeleton')).toHaveLength(8);
  });

  it('uses base backlog redirect/auth path when category is missing', async () => {
    render(
      await BacklogPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(requireServerAuth).toHaveBeenCalledWith('/backlog');
    expect(getBreadcrumbStructuredData).toHaveBeenCalledWith([
      { name: 'Home', url: `${SITE_URL}/` },
      { name: 'Backlog', url: `${SITE_URL}/backlog` },
    ]);
  });
});
