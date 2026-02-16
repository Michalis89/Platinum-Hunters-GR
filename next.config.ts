import { join } from 'node:path';
import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: !!process.env.ANALYZE,
  openAnalyzer: true,
});

type NextConfigWithInstrumentation = NextConfig & {
  experimental?: NextConfig['experimental'] & {
    instrumentationHook?: boolean;
  };
};

const nextConfig: NextConfigWithInstrumentation = {
  productionBrowserSourceMaps: true,
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
        hostname: 'images.igdb.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.cloudflare.steamstatic.com',
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
        source: '/pages/backlog',
        destination: '/backlog',
        permanent: true,
      },
      {
        source: '/pages/news',
        destination: '/articles',
        permanent: true,
      },
      {
        source: '/pages/news/:slug',
        destination: '/articles/:slug',
        permanent: true,
      },
      {
        source: '/news',
        destination: '/articles',
        permanent: true,
      },
      {
        source: '/news/:slug',
        destination: '/articles/:slug',
        permanent: true,
      },
      {
        source: '/pages/reviews',
        destination: '/review',
        permanent: true,
      },
      {
        source: '/pages/reviews/:slug',
        destination: '/review/:slug',
        permanent: true,
      },
      {
        source: '/reviews',
        destination: '/review',
        permanent: true,
      },
      {
        source: '/reviews/:slug',
        destination: '/review/:slug',
        permanent: true,
      },
      {
        source: '/pages/news/jujutsu-kaisen-anime-manga-1010',
        destination: '/review/jujutsu-kaisen-anime-manga-1010',
        permanent: true,
      },
      {
        source: '/articles/jujutsu-kaisen-anime-manga-1010',
        destination: '/review/jujutsu-kaisen-anime-manga-1010',
        permanent: true,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
