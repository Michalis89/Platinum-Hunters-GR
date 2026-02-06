'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { TurnstileWindow } from '@/types/turnstile';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_ID = 'cf-turnstile-script';
let turnstileLoader: Promise<void> | null = null;

const ensureTurnstileScript = () => {
  if (turnstileLoader) return turnstileLoader;
  turnstileLoader = new Promise(resolve => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      if ((window as Window & { turnstile?: unknown }).turnstile) {
        resolve();
      } else {
        existingScript.addEventListener('load', () => resolve());
      }
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
  return turnstileLoader;
};

type CaptchaWidgetProps = {
  onTokenChange: (token: string | null) => void;
  helperText?: ReactNode;
  resetSignal?: number;
};

export default function CaptchaWidget({ onTokenChange, helperText, resetSignal }: CaptchaWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const onTokenRef = useRef(onTokenChange);
  const hasRenderedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onTokenRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (hasRenderedRef.current) return;
    if (!SITE_KEY) {
      setError('Το CAPTCHA δεν έχει ρυθμιστεί σωστά.');
      onTokenRef.current(null);
      return;
    }
    hasRenderedRef.current = true;

    let cancelled = false;

    const renderWidget = () => {
      if (!containerRef.current) return;
      if (typeof window === 'undefined' || !(window as Window & { turnstile?: unknown }).turnstile) return;

      const loaderWindow = window as Window & { turnstile: TurnstileWindow };
      if (!loaderWindow.turnstile) return;

      const widgetId = loaderWindow.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        theme: 'dark',
        callback: token => {
          setError(null);
          setReady(true);
          onTokenRef.current(token);
        },
        'expired-callback': () => {
          setReady(false);
          onTokenRef.current(null);
        },
        'error-callback': () => {
          setError('Το CAPTCHA δεν φορτώθηκε. Δοκίμασε ξανά.');
          setReady(false);
          onTokenRef.current(null);
        },
      });

      widgetIdRef.current = widgetId;
    };

    ensureTurnstileScript()
      .then(() => {
        if (cancelled) return;
        renderWidget();
      })
      .catch(() => {
        if (cancelled) return;
        setError('Το CAPTCHA δεν φορτώθηκε. Δοκίμασε ξανά.');
        onTokenRef.current(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (resetSignal === undefined) return;
    if (
      widgetIdRef.current === null ||
      typeof window === 'undefined' ||
      !(window as Window & { turnstile?: unknown }).turnstile
    )
      return;

    const loaderWindow = window as Window & { turnstile: TurnstileWindow };
    loaderWindow.turnstile.reset(widgetIdRef.current);
    setReady(false);
    onTokenRef.current(null);
  }, [resetSignal]);

  return (
    <div className="space-y-2 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 py-4 shadow-[var(--hb-shadow-sm)]">
      <div ref={containerRef} />
      {helperText && <p className="text-xs text-[var(--hb-muted)]">{helperText}</p>}
      {error && <p className="text-xs text-rose-300">{error}</p>}
      {!error && !ready && (
        <p className="text-xs text-[var(--hb-muted)]">Φόρτωση CAPTCHA...</p>
      )}
    </div>
  );
}
