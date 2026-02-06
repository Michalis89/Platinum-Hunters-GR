import { Geist, Geist_Mono } from 'next/font/google';
import { cookies } from 'next/headers';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import StructuredData from '@/utils/seo/StructuredData';
import AuthInit from './components/AuthInit';

import {
  organizationStructuredData,
  websiteStructuredData,
} from '@/utils/seo/metadata/structuredData';
import Providers from '@/store/Providers';
export { metadata } from '@/utils/seo/metadata/metadata';

// Font optimization: removed 'latin-ext' subset (~10KB savings)
// 'swap' ensures text is visible immediately with fallback font
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

type Theme = 'dark' | 'light';

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('theme')?.value;
  const initialTheme: Theme = themeCookie === 'light' ? 'light' : 'dark';
  const isVercelProd = process.env.NODE_ENV === 'production' && !!process.env.VERCEL;

  return (
    <html lang="el" data-theme={initialTheme} suppressHydrationWarning>
      <head>
        <StructuredData data={organizationStructuredData} />
        <StructuredData data={websiteStructuredData} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers initialTheme={initialTheme}>
          <AuthInit />
          {children}
          {isVercelProd ? (
            <>
              <Analytics />
              <SpeedInsights />
            </>
          ) : null}
        </Providers>
      </body>
    </html>
  );
}
