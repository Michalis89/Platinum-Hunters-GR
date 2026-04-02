import type { Viewport } from 'next';
import { IBM_Plex_Mono, Lora, Plus_Jakarta_Sans } from 'next/font/google';
import { cookies } from 'next/headers';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import StructuredData from '@/utils/seo/StructuredData';
import RouteAwareAuthInit from './components/RouteAwareAuthInit';

import {
  organizationStructuredData,
  websiteStructuredData,
} from '@/utils/seo/metadata/structuredData';
import Providers from '@/store/Providers';
import { GoogleAnalytics } from './components/analytics/GoogleAnalytics';
import { LocaleProvider } from '@/context/LocaleContext';
export { metadata } from '@/utils/seo/metadata/metadata';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0b0b0f' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
  viewportFit: 'cover',
};

const fontSans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const fontSerif = Lora({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'swap',
});

const fontMono = IBM_Plex_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

type Theme = 'dark' | 'light';
type ThemePreference = 'system' | 'dark' | 'light';

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('theme')?.value;
  const themePreferenceCookie = cookieStore.get('theme-preference')?.value;

  // Determine initial preference (defaults to 'system')
  const initialPreference: ThemePreference =
    themePreferenceCookie === 'system' ||
    themePreferenceCookie === 'dark' ||
    themePreferenceCookie === 'light'
      ? themePreferenceCookie
      : 'system';

  // Determine resolved theme for SSR (defaults to 'dark')
  const initialTheme: Theme = themeCookie === 'light' ? 'light' : 'dark';
  const isVercelProd = process.env.NODE_ENV === 'production' && !!process.env.VERCEL;
  const isProd = process.env.NODE_ENV === 'production';
  const gaId = isProd ? process.env.NEXT_PUBLIC_GA_ID : undefined;

  return (
    <html
      lang="en"
      data-theme={initialTheme}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <StructuredData data={organizationStructuredData} />
        <StructuredData data={websiteStructuredData} />
      </head>
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <LocaleProvider>
          {/* Skip to main content link for keyboard navigation accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[9999] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
          >
            Skip to main content
          </a>

          <Providers initialTheme={initialTheme} initialPreference={initialPreference}>
            <RouteAwareAuthInit />
            {children}
            {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
            {isVercelProd ? (
              <>
                <Analytics />
                <SpeedInsights />
              </>
            ) : null}
          </Providers>
        </LocaleProvider>
      </body>
    </html>
  );
}
