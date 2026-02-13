import ArticleDetailPage, {
  ArticleDetailPageOptions,
  buildArticleDetailMetadata,
} from '@/app/(main)/pages/_shared/ArticleDetailPage';

const NEWS_DETAIL_OPTIONS: ArticleDetailPageOptions = {
  basePath: '/pages/news',
  breadcrumbLabel: 'Άρθρα',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return buildArticleDetailMetadata({
    params,
    options: NEWS_DETAIL_OPTIONS,
  });
}

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ArticleDetailPage
      params={params}
      basePath={NEWS_DETAIL_OPTIONS.basePath}
      breadcrumbLabel={NEWS_DETAIL_OPTIONS.breadcrumbLabel}
    />
  );
}
