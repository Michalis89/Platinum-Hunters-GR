import type { Metadata } from 'next';
import ReviewsPageClient from '@/app/(main)/review/ReviewsPageClient';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import { CATEGORY_LABELS } from '@/app/(main)/articles/constants';
import type { ArticleCategory } from '@/types/database';
import StructuredData from '@/utils/seo/StructuredData';
import { getBreadcrumbStructuredData } from '@/utils/seo/metadata/structuredData';
import { SITE_URL } from '@/config/site';

type ReviewsPageProps = {
  searchParams: Promise<{ category?: string }>;
};

const DEFAULT_DESCRIPTION =
  'Explore honest, community-written reviews across games, anime, manga, movies, TV, books, and more.';

export async function generateMetadata({ searchParams }: ReviewsPageProps): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const rawCategory = resolvedParams.category;
  const category =
    rawCategory && CATEGORY_LABELS[rawCategory as ArticleCategory]
      ? (rawCategory as ArticleCategory)
      : undefined;
  const categoryLabel = category ? CATEGORY_LABELS[category] : undefined;

  const title = categoryLabel ? `Reviews for ${categoryLabel} | Hobbistas` : 'Reviews | Hobbistas';
  const description = categoryLabel
    ? `Browse community reviews for ${categoryLabel} on Hobbistas.`
    : DEFAULT_DESCRIPTION;
  const path = category ? `/review?category=${category}` : '/review';

  return buildMetadata({
    title,
    description,
    path,
  });
}

export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const resolvedParams = await searchParams;
  const rawCategory = resolvedParams.category;
  const category =
    rawCategory && CATEGORY_LABELS[rawCategory as ArticleCategory]
      ? (rawCategory as ArticleCategory)
      : undefined;
  const categoryLabel = category ? CATEGORY_LABELS[category] : undefined;

  const breadcrumb = [
    { name: 'Home', url: `${SITE_URL}/` },
    { name: 'Reviews', url: `${SITE_URL}/review` },
  ];

  if (categoryLabel) {
    breadcrumb.push({
      name: categoryLabel,
      url: `${SITE_URL}/review?category=${category}`,
    });
  }

  return (
    <>
      <StructuredData data={getBreadcrumbStructuredData(breadcrumb)} />
      <ReviewsPageClient />
    </>
  );
}