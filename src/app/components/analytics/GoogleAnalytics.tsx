'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';
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
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!gaId || !window.gtag) {
      return;
    }

    // Skip first run (already tracked in init script)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

    window.gtag('event', 'page_view', {
      page_location: window.location.href,
      page_path: url,
      page_title: document.title,
    });
  }, [gaId, pathname, searchParams]);

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

          gtag('config', '${gaId}', { send_page_view: false });

          // Initial page view
          gtag('event', 'page_view', {
            page_location: window.location.href,
            page_path: window.location.pathname + window.location.search,
            page_title: document.title,
          });
        `}
      </Script>
    </>
  );
}
