import type { Metadata } from 'next';
import BacklogPageClient from '@/app/(main)/backlog/BacklogPageClient';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import { getCategoryBySlug } from '@/config/hobbies';
import StructuredData from '@/utils/seo/StructuredData';
import { getBreadcrumbStructuredData } from '@/utils/seo/metadata/structuredData';
import { SITE_URL } from '@/config/site';
import { requireServerAuth } from '@/lib/auth/requireServerAuth';

export const revalidate = 300;

type BacklogPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata({ searchParams }: BacklogPageProps): Promise<Metadata> {
  const { category } = await searchParams;
  const normalizedCategory = category?.toLowerCase();
  const categoryData = normalizedCategory ? getCategoryBySlug(normalizedCategory) : undefined;
  const categoryLabel = categoryData?.title;

  const title = categoryLabel
    ? `Backlog for ${categoryLabel} | Hobbistas`
    : 'Backlog & Progress | Hobbistas';

  const description = categoryLabel
    ? `Organize your ${categoryLabel} backlog with goals, notes, and progress tracking.`
    : 'Organize your backlog with goals, progress tracking, and per-hobby insights.';

  // Canonical strategy: treat category query pages as first-class and keep their querystring.
  const path = normalizedCategory ? `/backlog?category=${normalizedCategory}` : '/backlog';

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
    { name: 'Home', url: `${SITE_URL}/` },
    { name: 'Backlog', url: `${SITE_URL}/backlog` },
  ];

  if (categoryLabel) {
    breadcrumb.push({
      name: categoryLabel,
      url: `${SITE_URL}/backlog?category=${normalizedCategory}`,
    });
  }

  const redirectPath = normalizedCategory ? `/backlog?category=${normalizedCategory}` : '/backlog';
  await requireServerAuth(redirectPath);

  return (
    <>
      <StructuredData data={getBreadcrumbStructuredData(breadcrumb)} />
      <BacklogPageClient />
    </>
  );
}
