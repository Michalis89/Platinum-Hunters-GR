'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
  }
}

type Props = {
  gaId: string;
};

export function GoogleAnalytics({ gaId }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAuthRoute = (pathname ?? '').startsWith('/auth/');
  const [shouldLoadScripts, setShouldLoadScripts] = useState(false);

  useEffect(() => {
    if (!gaId || typeof window === 'undefined') {
      return;
    }

    const isHomeRoute = pathname === '/home';
    const isMobile =
      window.matchMedia('(max-width: 768px)').matches ||
      window.matchMedia('(hover: none)').matches;

    if (isHomeRoute && isMobile) {
      const timerId = window.setTimeout(() => setShouldLoadScripts(true), 12000);
      return () => window.clearTimeout(timerId);
    }

    setShouldLoadScripts(true);
  }, [gaId, pathname]);

  // Optional: track SPA navigations (keep this for App Router certainty)
  useEffect(() => {
    if (!gaId || !window.gtag || isAuthRoute || !shouldLoadScripts) {
      return;
    }

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

    window.gtag('event', 'page_view', {
      page_location: window.location.href,
      page_path: url,
      page_title: document.title,
    });
  }, [gaId, pathname, searchParams, isAuthRoute, shouldLoadScripts]);

  if (isAuthRoute || !shouldLoadScripts) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());

          // Let GA send the initial page_view automatically
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
