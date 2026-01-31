import type { Metadata } from 'next';
import ReviewsPageClient from '@/app/(main)/pages/reviews/ReviewsPageClient';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import { CATEGORY_LABELS } from '@/app/(main)/pages/news/constants';
import type { ArticleCategory } from '@/types/database';
import StructuredData from '@/utils/seo/StructuredData';
import { getBreadcrumbStructuredData } from '@/utils/seo/metadata/structuredData';
import { SITE_URL } from '@/config/site';

type ReviewsPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata({ searchParams }: ReviewsPageProps): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const rawCategory = resolvedParams.category;
  const category =
    rawCategory && CATEGORY_LABELS[rawCategory as ArticleCategory]
      ? (rawCategory as ArticleCategory)
      : undefined;
  const categoryLabel = category ? CATEGORY_LABELS[category] : undefined;

  const title = categoryLabel
    ? `Reviews για ${categoryLabel} | Hobbistas`
    : 'Reviews & Κριτικές | Hobbistas';

  const description = categoryLabel
    ? `Reviews και κριτικές για ${categoryLabel}, από την κοινότητα του Hobbistas.`
    : 'Αντικειμενικές κριτικές για Games, Anime, Manga, Ταινίες, Σειρές, Βιβλία και Vapes από την κοινότητα του Hobbistas.';
  const path = category ? `/pages/reviews?category=${category}` : '/pages/reviews';

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
    { name: 'Αρχική', url: `${SITE_URL}/` },
    { name: 'Reviews', url: `${SITE_URL}/pages/reviews` },
  ];

  if (categoryLabel) {
    breadcrumb.push({
      name: categoryLabel,
      url: `${SITE_URL}/pages/reviews?category=${category}`,
    });
  }

  return (
    <>
      <StructuredData data={getBreadcrumbStructuredData(breadcrumb)} />
      <ReviewsPageClient />
    </>
  );
}
