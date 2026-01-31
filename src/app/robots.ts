import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/pages/auth',
          '/pages/auth/login',
          '/pages/auth/register',
          '/pages/auth/reset-password',
          '/admin',
          '/dashboard',
          '/private',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
