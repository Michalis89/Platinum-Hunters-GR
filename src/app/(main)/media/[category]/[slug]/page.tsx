import { Suspense } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import { isMediaCategory } from '@/app/components/backlog/types';
import type { MediaItem } from '@/lib/media/types';
import MediaDetailPageClient from './MediaDetailPageClient';

type MediaDetailPageProps = {
  params: Promise<{ category: string; slug: string }>;
};

async function fetchMediaItem(category: string, slug: string): Promise<MediaItem | null> {
  const headerStore = await headers();
  const host = headerStore.get('host');
  const proto = headerStore.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${proto}://${host}` : '';
  const url = `${baseUrl}/api/media/item?category=${encodeURIComponent(category)}&slug=${encodeURIComponent(slug)}`;
  const response = await fetch(url, { cache: 'no-store' });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    console.error('Media item fetch failed:', response.status, response.statusText);
    return null;
  }

  const data = (await response.json()) as { item?: MediaItem | null };
  return data.item ?? null;
}

async function MediaDetailContent({ params }: MediaDetailPageProps) {
  const { category, slug } = await params;
  const normalizedCategory = category.toLowerCase();

  if (!isMediaCategory(normalizedCategory)) {
    notFound();
  }

  const item = await fetchMediaItem(normalizedCategory, slug);
  if (!item) {
    notFound();
  }

  return <MediaDetailPageClient category={normalizedCategory} mediaItem={item} />;
}

export default function MediaDetailPage({ params }: MediaDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner label="Φόρτωση..." />
        </div>
      }
    >
      <MediaDetailContent params={params} />
    </Suspense>
  );
}
