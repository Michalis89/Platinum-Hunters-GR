import { render, screen } from '@testing-library/react';
import ReviewPage, { generateMetadata } from '@/app/(main)/review/[slug]/page';
import ArticleDetailPage, {
  buildArticleDetailMetadata,
} from '@/app/(main)/pages/_shared/ArticleDetailPage';

jest.mock('@/app/(main)/pages/_shared/ArticleDetailPage', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="article-detail-page" />),
  buildArticleDetailMetadata: jest.fn(),
}));

describe('review/[slug]/page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates metadata generation with review detail options', async () => {
    const metadataResult = { title: 'Review title' };
    (buildArticleDetailMetadata as jest.Mock).mockResolvedValue(metadataResult);
    const params = Promise.resolve({ slug: 'my-review' });

    const result = await generateMetadata({ params });

    expect(result).toEqual(metadataResult);
    expect(buildArticleDetailMetadata).toHaveBeenCalledWith({
      params,
      options: {
        basePath: '/review',
        breadcrumbLabel: 'Reviews',
        topicFilter: 'reviews',
      },
    });
  });

  it('renders ArticleDetailPage with expected props', () => {
    const params = Promise.resolve({ slug: 'my-review' });

    render(<ReviewPage params={params} />);

    expect(screen.getByTestId('article-detail-page')).toBeInTheDocument();
    expect(ArticleDetailPage).toHaveBeenCalledWith(
      expect.objectContaining({
        params,
        basePath: '/review',
        breadcrumbLabel: 'Reviews',
        topicFilter: 'reviews',
      }),
      undefined,
    );
  });
});
