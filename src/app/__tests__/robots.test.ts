import robots from '@/app/robots';
import { SITE_URL } from '@/config/site';

describe('robots', () => {
  it('returns crawl rules and sitemap metadata', () => {
    const result = robots();

    expect(result).toEqual({
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
    });
  });
});
