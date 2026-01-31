import { join } from 'node:path';
import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: !!process.env.ANALYZE,
  openAnalyzer: true,
});

const nextConfig: NextConfig = {
  outputFileTracingRoot: join(process.cwd()),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.api.playstation.com',
      },
      {
        protocol: 'https',
        hostname: 'psnobj.prod.dl.playstation.net',
      },
      {
        protocol: 'https',
        hostname: 'i.psnprofiles.com',
      },
      {
        protocol: 'https',
        hostname: 'media.rawg.io',
      },
      {
        protocol: 'https',
        hostname: 's4.anilist.co',
      },
      {
        protocol: 'https',
        hostname: 'cdn.myanimelist.net',
      },
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
      {
        protocol: 'https',
        hostname: 'books.google.com',
      },
      {
        protocol: 'https',
        hostname: 'jolfksxuhyktpwncniks.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'www.replacesmoke.com',
      },
      {
        protocol: 'https',
        hostname: 'images.thedirect.com',
      },
      {
        protocol: 'https',
        hostname: 'c.scdn.gr',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/pages/news/jujutsu-kaisen-anime-manga-1010',
        destination: '/pages/reviews/jujutsu-kaisen-anime-manga-1010',
        permanent: true,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
