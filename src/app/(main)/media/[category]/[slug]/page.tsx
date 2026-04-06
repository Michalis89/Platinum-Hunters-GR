import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { isMediaCategory } from '@/app/components/backlog/types';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import { MediaDetailContent } from './mediaDetailContent';
import {
  fetchMediaItem,
  resolveCanonicalSlug,
  resolveMediaCover,
  resolveMediaDescription,
  resolveMediaTitle,
} from '@/app/components/media-detail/mediaDetailPage.helpers';
import type { MediaDetailPageProps } from './mediaDetailContent';

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const normalizedCategory = category.toLowerCase();

  if (!isMediaCategory(normalizedCategory)) {
    notFound();
  }

  const item = await fetchMediaItem(normalizedCategory, slug);
  if (!item) {
    notFound();
  }

  const title = resolveMediaTitle(item);
  if (!title) {
    notFound();
  }

  const summary = resolveMediaDescription(item);
  const coverImage = resolveMediaCover(item);
  const canonicalSlug = resolveCanonicalSlug(item, slug);

  return buildMetadata({
    title: `${title} | Hobbistas`,
    description: summary,
    path: `/media/${normalizedCategory}/${canonicalSlug}`,
    images: coverImage
      ? [{ url: coverImage, alt: title, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }]
      : undefined,
    openGraphType: 'website',
  });
}

export default function MediaDetailPage({ params }: MediaDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <Spinner />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
      }
    >
      <MediaDetailContent params={params} />
    </Suspense>
  );
}
