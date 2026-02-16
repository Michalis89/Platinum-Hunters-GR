/** @type {import('next-sitemap').IConfig} */
import { createClient } from '@supabase/supabase-js';

const siteUrl = (
  process.env.SITE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  'https://hobbistas-hub.com'
).replace(/\/$/, '');

const supabaseAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

// Keep ONLY truly public pages here
const STATIC_PUBLIC = ['/', '/about', '/articles', '/review', '/terms', '/privacy'];

const PRIVATE_EXCLUDES = [
  '/admin',
  '/admin/*',
  '/api',
  '/api/*',
  '/auth',
  '/auth/*',
  '/dashboard',
  '/settings',
  '/profile',
  '/profile/*',
  '/profile/edit',
  '/support',
  '/support/*',
];

const config = {
  siteUrl,
  generateRobotsTxt: false,
  exclude: PRIVATE_EXCLUDES,
  additionalPaths: async () => {
    const now = new Date().toISOString();
    const pathMap = new Map();
    const addPath = entry => {
      if (!entry?.loc) {return;}
      pathMap.set(entry.loc, entry);
    };

    STATIC_PUBLIC.forEach(path => {
      addPath({
        loc: path,
        changefreq: path === '/' ? 'daily' : 'weekly',
        priority: path === '/' ? 1.0 : 0.7,
        lastmod: now,
      });
    });

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Array.from(pathMap.values());
    }

    const supabase = supabaseAdmin();
    const { data: articles, error } = await supabase
      .from('articles')
      .select('slug, updated_at, topic')
      .eq('status', 'published');

    if (!error && Array.isArray(articles)) {
      for (const item of articles) {
        if (!item?.slug) {continue;}

        const basePath = item.topic === 'reviews' ? '/review' : '/articles';
        addPath({
          loc: `${basePath}/${item.slug}`,
          changefreq: item.topic === 'reviews' ? 'monthly' : 'weekly',
          priority: 0.8,
          lastmod: item.updated_at ? new Date(item.updated_at).toISOString() : now,
        });
      }
    }

    const { data: mediaItems, error: mediaError } = await supabase
      .from('media_items')
      .select('slug, category, updated_at, status')
      .eq('status', 'published');

    if (!mediaError && Array.isArray(mediaItems)) {
      for (const item of mediaItems) {
        if (item?.status !== 'published') {continue;}
        if (!item?.slug || !item?.category) {continue;}

        addPath({
          loc: `/media/${item.category}/${item.slug}`,
          changefreq: 'monthly',
          priority: 0.7,
          lastmod: item.updated_at ? new Date(item.updated_at).toISOString() : now,
        });
      }
    }

    return Array.from(pathMap.values());
  },
  transform: async () => null,
};

export default config;
