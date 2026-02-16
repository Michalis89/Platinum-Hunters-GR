import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api',
          '/api/',
          '/auth',
          '/auth/',
          '/settings',
          '/dashboard',
          '/profile',
          '/profile/',
          '/profile/edit',
          '/support',
          '/support/',
          '/support/tickets',
          '/support/tickets/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
