import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import ScrollToTop from '@/utils/ScrollToTop';
import StructuredData from '@/utils/seo/StructuredData';
import AuthInit from './components/AuthInit';
import AppShell from './components/AppShell';

import {
  websiteStructuredData,
  trophyGuideStructuredData,
  contactFormStructuredData,
} from '@/utils/seo/metadata/structuredData';
import Providers from '@/store/Providers';
import HeartbeatPing from './components/HeartbeatPing';
export { metadata } from '@/utils/seo/metadata/metadata';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

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
          <AuthInit />
          <HeartbeatPing />
          <ScrollToTop />
          <AppShell>{children}</AppShell>
          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
