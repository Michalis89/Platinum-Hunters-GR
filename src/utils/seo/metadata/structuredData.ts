import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  SITE_LANGUAGE,
  SITE_NAME,
  SITE_URL,
} from '@/config/site';

type ArticleStructuredDataInput = {
  title: string;
  description?: string | null;
  url: string;
  image?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  authorName?: string | null;
};

type BreadcrumbItem = {
  name: string;
  url: string;
};

const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString();

export const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: absoluteUrl(DEFAULT_OG_IMAGE),
    width: 1200,
    height: 630,
    caption: DEFAULT_OG_IMAGE_ALT,
  },
};

export const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  inLanguage: SITE_LANGUAGE,
  publisher: organizationStructuredData,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/articles?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export const getArticleStructuredData = ({
  title,
  description,
  url,
  image,
  publishedAt,
  updatedAt,
  authorName,
}: ArticleStructuredDataInput) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description: description || DEFAULT_DESCRIPTION,
  image: [image ? absoluteUrl(image) : absoluteUrl(DEFAULT_OG_IMAGE)],
  datePublished: publishedAt ?? undefined,
  dateModified: updatedAt ?? publishedAt ?? undefined,
  author: {
    '@type': 'Person',
    name: authorName || SITE_NAME,
  },
  publisher: organizationStructuredData,
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': url,
  },
});

export const getBreadcrumbStructuredData = (items: BreadcrumbItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});
