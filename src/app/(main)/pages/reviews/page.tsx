import type { Metadata } from 'next';
import UnderConstruction from '@/app/components/ui/UnderConstruction';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import { getCategoryBySlug } from '@/config/hobbies';
import StructuredData from '@/utils/seo/StructuredData';
import { getBreadcrumbStructuredData } from '@/utils/seo/metadata/structuredData';
import { SITE_URL } from '@/config/site';

type ReviewsPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata({ searchParams }: ReviewsPageProps): Promise<Metadata> {
  const { category } = await searchParams;
  const normalizedCategory = category?.toLowerCase();
  const categoryData = normalizedCategory ? getCategoryBySlug(normalizedCategory) : undefined;
  const categoryLabel = categoryData?.title;

  const title = categoryLabel
    ? `Reviews για ${categoryLabel} | Χομπίστας`
    : 'Reviews & Κριτικές | Χομπίστας';

  const description = categoryLabel
    ? `Reviews και κριτικές για ${categoryLabel}, από την κοινότητα του Χομπίστα.`
    : 'Reviews και κριτικές από την κοινότητα του Χομπίστα. Δες τι αξίζει να δοκιμάσεις.';

  // Canonical strategy: treat category query pages as first-class and keep their querystring.
  const path = normalizedCategory ? `/pages/reviews?category=${normalizedCategory}` : '/pages/reviews';

  return buildMetadata({
    title,
    description,
    path,
  });
}

export default async function ReviewPage({ searchParams }: ReviewsPageProps) {
  const { category } = await searchParams;
  const normalizedCategory = category?.toLowerCase();
  const categoryData = normalizedCategory ? getCategoryBySlug(normalizedCategory) : undefined;
  const categoryLabel = categoryData?.title;
  const breadcrumb = [
    { name: 'Αρχική', url: `${SITE_URL}/` },
    { name: 'Reviews', url: `${SITE_URL}/pages/reviews` },
  ];

  if (categoryLabel) {
    breadcrumb.push({
      name: categoryLabel,
      url: `${SITE_URL}/pages/reviews?category=${normalizedCategory}`,
    });
  }

  return (
    <>
      <StructuredData data={getBreadcrumbStructuredData(breadcrumb)} />
      <UnderConstruction />
    </>
  );
}
