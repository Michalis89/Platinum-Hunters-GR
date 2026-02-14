/** @type {import('next-sitemap').IConfig} */
import { createClient } from '@supabase/supabase-js';

const siteUrl = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const supabaseAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

const STATIC_PUBLIC = [
  '/',
  '/pages/about',
  '/pages/reviews',
  '/pages/news',
  '/pages/terms',
  '/pages/privacy',
];

const config = {
  siteUrl,
  generateRobotsTxt: true,

  additionalPaths: async () => {
    const paths = STATIC_PUBLIC.map(path => ({
      loc: path,
      changefreq: path === '/' ? 'daily' : 'weekly',
      priority: path === '/' ? 1.0 : 0.7,
      lastmod: new Date().toISOString(),
    }));

    // Αν λείπουν envs, απλά γύρνα τα static (να μην σκάει το build)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return paths;
    }

    const supabase = supabaseAdmin();

    // ✅ NEWS (2 public άρθρα)
    // Υπόθεση: table `articles` με fields: `slug`, `updated_at`, `status`
    const { data: articles, error } = await supabase
      .from('articles')
      .select('slug, updated_at, topic')
      .eq('status', 'published');

    if (!error && Array.isArray(articles)) {
      for (const item of articles) {
        if (!item?.slug) continue;

        const isReview = item.topic === 'reviews';
        const basePath = isReview ? '/pages/reviews' : '/pages/news';

        paths.push({
          loc: `${basePath}/${item.slug}`,
          changefreq: isReview ? 'monthly' : 'weekly',
          priority: 0.8,
          lastmod: item.updated_at
            ? new Date(item.updated_at).toISOString()
            : new Date().toISOString(),
        });
      }
    }

    return paths;
  },

  // Whitelist-only: μπλοκάρουμε ό,τι άλλο “ανακαλύψει” το tool
  transform: async () => null,
};

export default config;
