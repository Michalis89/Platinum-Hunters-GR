import type { Metadata } from 'next';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
} from '@/config/site';

type MetadataInput = {
  title: string;
  description?: string;
  path: string;
  images?: Array<{ url: string; alt?: string }>;
  openGraphType?: 'website' | 'article';
  publishedTime?: string;
  authors?: string[];
  modifiedTime?: string;
  noindex?: boolean;
};

const toAbsoluteUrl = (path: string) => new URL(path, SITE_URL).toString();

const buildImages = (images?: Array<{ url: string; alt?: string }>) => {
  if (images && images.length > 0) {
    return images.map((image) => ({
      url: image.url.startsWith('http') ? image.url : toAbsoluteUrl(image.url),
      alt: image.alt || DEFAULT_OG_IMAGE_ALT,
    }));
  }
  return [
    {
      url: toAbsoluteUrl(DEFAULT_OG_IMAGE),
      alt: DEFAULT_OG_IMAGE_ALT,
    },
  ];
};

export const buildMetadata = ({
  title,
  description,
  path,
  images,
  openGraphType = 'website',
  publishedTime,
  authors,
  modifiedTime,
  noindex,
}: MetadataInput): Metadata => {
  const url = toAbsoluteUrl(path);
  const resolvedDescription = description ?? DEFAULT_DESCRIPTION;
  const ogImages = buildImages(images);

  return {
    title,
    description: resolvedDescription,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description: resolvedDescription,
      url,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      type: openGraphType,
      images: ogImages,
    ...(publishedTime ? { publishedTime } : {}),
    ...(modifiedTime ? { modifiedTime } : {}),
    ...(authors ? { authors } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: resolvedDescription,
      images: ogImages.map((image) => image.url),
    },
    ...(noindex
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
  };
};
