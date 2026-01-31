import type { Metadata } from 'next';
import NewsPageClient from '@/app/(main)/pages/news/NewsPageClient';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import {
  CATEGORY_LABELS,
  CATEGORY_SUBTITLES,
  TOPIC_LABELS,
} from '@/app/(main)/pages/news/constants';
import type { ArticleCategory } from '@/types/database';
import StructuredData from '@/utils/seo/StructuredData';
import { getBreadcrumbStructuredData } from '@/utils/seo/metadata/structuredData';
import { SITE_URL } from '@/config/site';

type NewsPageProps = {
  searchParams: Promise<{ category?: string; topic?: string }>;
};

export async function generateMetadata({ searchParams }: NewsPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const rawCategory = resolvedSearchParams.category;
  const category =
    rawCategory && CATEGORY_LABELS[rawCategory as ArticleCategory]
      ? (rawCategory as ArticleCategory)
      : undefined;
  const rawTopic = resolvedSearchParams.topic as keyof typeof TOPIC_LABELS | undefined;
  const topic = rawTopic === 'articles' ? undefined : rawTopic;
  const categoryLabel = category ? CATEGORY_LABELS[category] : undefined;
  const topicLabel = topic ? TOPIC_LABELS[topic] : undefined;
  const heading = topicLabel ?? 'Άρθρα';

  const title = categoryLabel
    ? `${heading} για ${categoryLabel} | Hobbistas`
    : `${heading} | Hobbistas`;

  const description =
    category && categoryLabel
      ? (CATEGORY_SUBTITLES[category] ??
        'Άρθρα, ιστορίες και εμπειρίες για κάθε χόμπι, επιμελημένα από την κοινότητα του Hobbista.')
      : 'Άρθρα, ιστορίες και εμπειρίες για κάθε χόμπι, επιμελημένα από την κοινότητα του Hobbista.';

  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (topic) params.set('topic', topic);

  // Canonical strategy: treat category/topic query pages as first-class and keep their querystring.
  const path = params.toString() ? `/pages/news?${params.toString()}` : '/pages/news';

  return buildMetadata({
    title,
    description,
    path,
  });
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const resolvedSearchParams = await searchParams;
  const rawCategory = resolvedSearchParams.category;
  const category =
    rawCategory && CATEGORY_LABELS[rawCategory as ArticleCategory]
      ? (rawCategory as ArticleCategory)
      : undefined;
  const rawTopic = resolvedSearchParams.topic as keyof typeof TOPIC_LABELS | undefined;
  const topic = rawTopic === 'articles' ? undefined : rawTopic;
  const categoryLabel = category ? CATEGORY_LABELS[category] : undefined;
  const topicLabel = topic ? TOPIC_LABELS[topic] : undefined;
  const heading = topicLabel ?? 'Άρθρα';
  const breadcrumb = [
    { name: 'Αρχική', url: `${SITE_URL}/` },
    { name: 'Άρθρα', url: `${SITE_URL}/pages/news` },
  ];

  if (categoryLabel) {
    const label = topicLabel ? `${heading} • ${categoryLabel}` : categoryLabel;
    breadcrumb.push({ name: label, url: `${SITE_URL}/pages/news?category=${category}` });
  }

  return (
    <>
      <StructuredData data={getBreadcrumbStructuredData(breadcrumb)} />
      <NewsPageClient />
    </>
  );
}
