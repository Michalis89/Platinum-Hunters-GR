import { render, screen } from '@testing-library/react';
import ArticlePage, { generateMetadata } from '@/app/(main)/articles/[slug]/page';
import ArticleDetailPage, {
  buildArticleDetailMetadata,
} from '@/app/(main)/pages/_shared/ArticleDetailPage';

jest.mock('@/app/(main)/pages/_shared/ArticleDetailPage', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="article-detail-page" />),
  buildArticleDetailMetadata: jest.fn(),
}));

describe('articles/[slug]/page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates metadata generation with article detail options', async () => {
    const metadataResult = { title: 'Article title' };
    (buildArticleDetailMetadata as jest.Mock).mockResolvedValue(metadataResult);
    const params = Promise.resolve({ slug: 'my-article' });

    const result = await generateMetadata({ params });

    expect(result).toEqual(metadataResult);
    expect(buildArticleDetailMetadata).toHaveBeenCalledWith({
      params,
      options: {
        basePath: '/articles',
        breadcrumbLabel: 'Articles',
      },
    });
  });

  it('renders ArticleDetailPage with expected props', () => {
    const params = Promise.resolve({ slug: 'my-article' });

    render(<ArticlePage params={params} />);

    expect(screen.getByTestId('article-detail-page')).toBeInTheDocument();
    expect(ArticleDetailPage).toHaveBeenCalledWith(
      expect.objectContaining({
        params,
        basePath: '/articles',
        breadcrumbLabel: 'Articles',
      }),
      undefined,
    );
  });
});
