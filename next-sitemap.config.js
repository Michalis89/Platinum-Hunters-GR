/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: 'https://platinumhunters.gr',
  generateRobotsTxt: true,
  sitemapSize: 5000,
  exclude: ['/admin', '/dashboard', 'scraper'],
  changefreq: 'daily',
  priority: 0.7,
}

export default config;
