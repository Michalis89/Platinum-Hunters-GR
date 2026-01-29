import ArticleDetailPage, {
  ArticleDetailPageOptions,
  buildArticleDetailMetadata,
} from '@/app/(main)/pages/_shared/ArticleDetailPage';

const REVIEW_DETAIL_OPTIONS: ArticleDetailPageOptions = {
  basePath: '/pages/reviews',
  breadcrumbLabel: 'Κριτικές',
  topicFilter: 'reviews',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return buildArticleDetailMetadata({
    params,
    options: REVIEW_DETAIL_OPTIONS,
  });
}

export default function ReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ArticleDetailPage
      params={params}
      basePath={REVIEW_DETAIL_OPTIONS.basePath}
      breadcrumbLabel={REVIEW_DETAIL_OPTIONS.breadcrumbLabel}
      topicFilter={REVIEW_DETAIL_OPTIONS.topicFilter}
    />
  );
}
