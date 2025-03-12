import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import NavbarWrapper from './components/NavbarWrapper';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Platinum Hunters GR - Trophy Guides & Game Completion',
  description:
    'Complete trophy guides and strategies to achieve platinum trophies in your favorite games. Join the Platinum Hunters GR community!',
  keywords: [
    'platinum trophies',
    'game guides',
    'trophy hunting',
    'game reviews',
    'gaming news',
    'backlog management',
    'PS5 trophies',
    'PS4 trophies',
    'gaming community',
    '100% game completion',

    'platinum trophies gr',
    'οδηγός trophy',
    'παιχνίδια platinum',
    'οδηγοί trophy',
    'gaming guides',
    'παιχνίδια PS5',
    'παιχνίδια PS4',
    'επίτευξη platinum',
    'κατάκτηση trophies',
    '100% ολοκλήρωση παιχνιδιού',
    'κοινότητα gaming',
    'κριτικές παιχνιδιών',
    'νέα gaming',
    'διαχείριση backlog',
    'gaming tips',
  ],

  authors: [{ name: 'Platinum Hunters GR', url: 'https://platinumhunters.gr' }],

  openGraph: {
    title: 'Platinum Hunters GR - Trophy Guides & Game Completion',
    description:
      'Complete trophy guides and strategies to achieve platinum trophies in your favorite games.',
    url: 'https://platinumhunters.gr',
    siteName: 'Platinum Hunters GR',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Platinum Hunters GR Logo',
      },
    ],

    locale: 'el_GR',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Platinum Hunters GR',
    description:
      'Complete trophy guides and strategies to achieve platinum trophies in your favorite games.',
    images: ['/og-image.png'],
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: 'https://platinumhunters.gr',
    languages: {
      el: 'https://platinumhunters.gr',
      en: 'https://platinumhunters.gr/',
    },
  },
};

const structuredData = {
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

const trophyGuideStructuredData = {
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
  step: [
    {
      '@type': 'HowToStep',
      name: 'Stage 1: Complete the Story',
      text: 'Complete all story quests first...',
      url: 'https://platinumhunters.gr/guides/assassins-creed-mirage',
      image: {
        '@type': 'ImageObject',
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    },
    {
      '@type': 'HowToStep',
      name: 'Stage 2: Collect Hidden Trophies',
      text: 'Explore the map to find hidden trophies...',
      url: 'https://platinumhunters.gr/guides/assassins-creed-mirage',
    },
  ],
};

const contactFormStructuredData = {
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

const articleStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Best Trophy Guides for 2025',
  datePublished: '2025-03-12',
  dateModified: '2025-03-12',
  author: {
    '@type': 'Person',
    name: 'Platinum Hunters GR',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Platinum Hunters GR',
    logo: {
      '@type': 'ImageObject',
      url: '/og-image.png',
    },
  },
  image: '/og-image.png',
  keywords: 'trophy guides, game completion, tips',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="el">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(trophyGuideStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(contactFormStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleStructuredData) }}
        />
      </head>
      <body className={` ${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NavbarWrapper />
        <main>{children}</main>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
