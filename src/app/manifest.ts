import type { MetadataRoute } from 'next';
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_NAME_EN } from '@/config/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
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
    icons: [
      {
        src: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/mobile.png',
        sizes: '390x844',
        type: 'image/png',
        label: 'Hobbistas mobile home',
      },
      {
        src: '/screenshots/desktop.png',
        sizes: '1280x720',
        type: 'image/png',
        label: 'Hobbistas dashboard',
        form_factor: 'wide',
      },
    ],
  };
}
