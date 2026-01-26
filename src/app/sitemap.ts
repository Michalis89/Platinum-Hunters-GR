import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/site';
import { HOBBY_CATEGORIES } from '@/config/hobbies';

const toUrl = (path: string) => new URL(path, SITE_URL).toString();

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '/',
    '/pages/about',
    '/pages/hobbies',
    '/pages/news',
    '/pages/reviews',
    '/pages/backlog',
    '/pages/guides',
    '/pages/terms',
    '/pages/privacy',
  ];

  const categoryRoutes = new Set<string>();

  HOBBY_CATEGORIES.forEach(category => {
    categoryRoutes.add(category.routes.news);
    categoryRoutes.add(category.routes.reviews);
    categoryRoutes.add(category.routes.backlog);
  });

  const now = new Date();

  return [...staticRoutes, ...categoryRoutes].map(route => ({
    url: toUrl(route),
    lastModified: now,
  }));
}
