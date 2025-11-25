import { metadata as siteMetadata } from '@/utils/seo/metadata/metadata';

import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import NavbarWrapper from './components/NavbarWrapper';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import ScrollToTop from '@/utils/ScrollToTop';
import StructuredData from '@/utils/seo/StructuredData';

import {
  websiteStructuredData,
  trophyGuideStructuredData,
  contactFormStructuredData,
} from '@/utils/seo/metadata/structuredData';
import Providers from '@/store/Providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = siteMetadata;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="el">
      <head>
        <StructuredData data={websiteStructuredData} />
        <StructuredData data={trophyGuideStructuredData} />
        <StructuredData data={contactFormStructuredData} />
      </head>
      <body
        suppressHydrationWarning
        className={` ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <NavbarWrapper />
          <ScrollToTop />
          <main>{children}</main>
          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
