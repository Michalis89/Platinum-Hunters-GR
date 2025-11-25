export const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Platinum Hunters GR',
  url: 'https://platinumhunters.gr',
  description:
    'Complete trophy guides and strategies to achieve platinum trophies in your favorite games.',
  publisher: {
    '@type': 'Organization',
    name: 'Platinum Hunters GR',
    logo: {
      '@type': 'ImageObject',
      url: '/og-image.png',
      width: 1200,
      height: 630,
    },
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://platinumhunters.gr/?s={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export const trophyGuideStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Complete Trophy Guide for Assassin’s Creed Mirage',
  description: 'Complete guide to achieve all trophies for Assassin’s Creed Mirage.',
  totalTime: 'PT5H',
  difficulty: 'hard',
  tool: [
    {
      '@type': 'HowToTool',
      name: 'Game Controller',
    },
  ],
};

export const contactFormStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  mainEntity: {
    '@type': 'ContactPoint',
    contactType: 'Customer Support',
    email: 'support@platinumhunters.gr',
    availableLanguage: ['English', 'Greek'],
    areaServed: ['Greece'],
  },
};
