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
  images?: Array<{ url: string; alt?: string; width?: number; height?: number }>;
  openGraphType?: 'website' | 'article';
  publishedTime?: string;
  authors?: string[];
  modifiedTime?: string;
  noindex?: boolean;
};

const toAbsoluteUrl = (path: string) => new URL(path, SITE_URL).toString();
const trimText = (value: string, maxLength = 160) => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {return normalized;}
  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
};

const normalizeCanonicalPath = (value: string) => {
  const url = new URL(value, SITE_URL);
  const pathname = url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '');
  return pathname || '/';
};

const SITE_TITLE_SUFFIX = `| ${SITE_NAME}`;
const SITE_TITLE_DASH_SUFFIX = `- ${SITE_NAME}`;

const normalizeTitle = (title: string) => {
  const trimmed = title.trim();
  if (trimmed.endsWith(SITE_TITLE_SUFFIX)) {
    return trimmed.slice(0, -SITE_TITLE_SUFFIX.length).trim();
  }
  if (trimmed.endsWith(SITE_TITLE_DASH_SUFFIX)) {
    return trimmed.slice(0, -SITE_TITLE_DASH_SUFFIX.length).trim();
  }
  return trimmed;
};

const buildImages = (
  images?: Array<{ url: string; alt?: string; width?: number; height?: number }>,
) => {
  if (images && images.length > 0) {
    return images.map(image => ({
      url: image.url.startsWith('http') ? image.url : toAbsoluteUrl(image.url),
      alt: image.alt || DEFAULT_OG_IMAGE_ALT,
      width: image.width,
      height: image.height,
    }));
  }
  return [
    {
      url: toAbsoluteUrl(DEFAULT_OG_IMAGE),
      alt: DEFAULT_OG_IMAGE_ALT,
      width: 1200,
      height: 630,
    },
  ];
};

export const buildMetadata = (input: MetadataInput): Metadata => {
  const resolvedTitle = normalizeTitle(input.title);
  const resolvedDescription = trimText(input.description ?? DEFAULT_DESCRIPTION);

  const canonicalPath = normalizeCanonicalPath(input.path);
  const canonicalUrl = new URL(canonicalPath, SITE_URL);
  const url = canonicalUrl.toString();

  const ogImages = buildImages(input.images);

  const isArticle = input.openGraphType === 'article';

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      type: input.openGraphType ?? 'website',
      images: ogImages,
      ...(isArticle && input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(isArticle && input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
      ...(isArticle && input.authors ? { authors: input.authors } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description: resolvedDescription,
      images: ogImages.map(i => i.url),
    },
    ...(input.noindex
      ? {
          robots: { index: false, follow: false },
        }
      : {}),
  };
};
