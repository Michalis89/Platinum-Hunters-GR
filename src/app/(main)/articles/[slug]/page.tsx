import ArticleDetailPage, {
  ArticleDetailPageOptions,
  buildArticleDetailMetadata,
} from '@/app/(main)/pages/_shared/ArticleDetailPage';

const ARTICLE_DETAIL_OPTIONS: ArticleDetailPageOptions = {
  basePath: '/articles',
  breadcrumbLabel: 'Articles',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return buildArticleDetailMetadata({
    params,
    options: ARTICLE_DETAIL_OPTIONS,
  });
}

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ArticleDetailPage
      params={params}
      basePath={ARTICLE_DETAIL_OPTIONS.basePath}
      breadcrumbLabel={ARTICLE_DETAIL_OPTIONS.breadcrumbLabel}
    />
  );
}
