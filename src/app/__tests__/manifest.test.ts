import manifest from '@/app/manifest';
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_NAME_EN } from '@/config/site';

describe('manifest', () => {
  it('returns the expected web app manifest metadata', () => {
    const result = manifest();

    expect(result).toMatchObject({
      id: '/home',
      name: SITE_NAME,
      short_name: SITE_NAME_EN,
      description: DEFAULT_DESCRIPTION,
      start_url: '/home',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#0b0b0f',
      theme_color: '#0b0b0f',
      categories: ['entertainment', 'lifestyle', 'social'],
    });

    expect(result.icons).toHaveLength(4);
    expect(result.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: '/web-app-manifest-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        }),
        expect.objectContaining({
          src: '/web-app-manifest-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        }),
        expect.objectContaining({
          src: '/icon-maskable-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable',
        }),
        expect.objectContaining({
          src: '/icon-maskable-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        }),
      ]),
    );

    expect(result.screenshots).toHaveLength(2);
    expect(result.screenshots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: '/screenshots/mobile.png',
          sizes: '390x844',
          type: 'image/png',
          label: 'Hobbistas mobile home',
        }),
        expect.objectContaining({
          src: '/screenshots/desktop.png',
          sizes: '1280x720',
          type: 'image/png',
          label: 'Hobbistas dashboard',
          form_factor: 'wide',
        }),
      ]),
    );
  });
});
