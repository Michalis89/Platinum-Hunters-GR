import type { Metadata } from 'next';
import BacklogPageClient from '@/app/(main)/pages/backlog/BacklogPageClient';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import { getCategoryBySlug } from '@/config/hobbies';
import StructuredData from '@/utils/seo/StructuredData';
import { getBreadcrumbStructuredData } from '@/utils/seo/metadata/structuredData';
import { SITE_URL } from '@/config/site';

type BacklogPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata({ searchParams }: BacklogPageProps): Promise<Metadata> {
  const { category } = await searchParams;
  const normalizedCategory = category?.toLowerCase();
  const categoryData = normalizedCategory ? getCategoryBySlug(normalizedCategory) : undefined;
  const categoryLabel = categoryData?.title;

  const title = categoryLabel
    ? `Backlog για ${categoryLabel} | Hobbistas`
    : 'Backlog & Πρόοδος | Hobbistas';

  const description = categoryLabel
    ? `Οργάνωσε το backlog σου για ${categoryLabel}, με στόχους, σημειώσεις και πρόοδο.`
    : 'Οργάνωσε το backlog σου με στόχους, πρόοδο και στατιστικά ανά χόμπι.';

  // Canonical strategy: treat category query pages as first-class and keep their querystring.
  const path = normalizedCategory
    ? `/pages/backlog?category=${normalizedCategory}`
    : '/pages/backlog';

  return buildMetadata({
    title,
    description,
    path,
  });
}

export default async function BacklogPage({ searchParams }: BacklogPageProps) {
  const { category } = await searchParams;
  const normalizedCategory = category?.toLowerCase();
  const categoryData = normalizedCategory ? getCategoryBySlug(normalizedCategory) : undefined;
  const categoryLabel = categoryData?.title;
  const breadcrumb = [
    { name: 'Αρχική', url: `${SITE_URL}/` },
    { name: 'Backlog', url: `${SITE_URL}/pages/backlog` },
  ];

  if (categoryLabel) {
    breadcrumb.push({
      name: categoryLabel,
      url: `${SITE_URL}/pages/backlog?category=${normalizedCategory}`,
    });
  }

  return (
    <>
      <StructuredData data={getBreadcrumbStructuredData(breadcrumb)} />
      <BacklogPageClient />
    </>
  );
}
