'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { TurnstileWindow } from '@/types/turnstile';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_LOAD_TIMEOUT_MS = 12000;
let turnstileLoader: Promise<void> | null = null;

const ensureTurnstileScript = () => {
  if (turnstileLoader) {
    return turnstileLoader;
  }

  turnstileLoader = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    let settled = false;
    const finalizeResolve = () => {
      if (settled) {
        return;
      }
      settled = true;
      resolve();
    };
    const finalizeReject = (error: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      reject(error);
    };
    const scheduleTimeout = () =>
      window.setTimeout(
        () => finalizeReject(new Error('turnstile-script-timeout')),
        SCRIPT_LOAD_TIMEOUT_MS,
      );

    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      if ((window as Window & { turnstile?: unknown }).turnstile) {
        finalizeResolve();
      } else {
        const timeoutId = scheduleTimeout();
        existingScript.addEventListener(
          'load',
          () => {
            clearTimeout(timeoutId);
            finalizeResolve();
          },
          { once: true },
        );
        existingScript.addEventListener(
          'error',
          () => {
            clearTimeout(timeoutId);
            finalizeReject(new Error('turnstile-script-error'));
          },
          { once: true },
        );
      }
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;

    const timeoutId = scheduleTimeout();
    script.onload = () => {
      clearTimeout(timeoutId);
      finalizeResolve();
    };
    script.onerror = () => {
      clearTimeout(timeoutId);
      finalizeReject(new Error('turnstile-script-error'));
    };

    document.body.appendChild(script);
  });

  return turnstileLoader.catch(error => {
    turnstileLoader = null;
    throw error;
  });
};

type CaptchaWidgetProps = {
  onTokenChange: (token: string | null) => void;
  helperText?: ReactNode;
  resetSignal?: number;
};

export default function CaptchaWidget({
  onTokenChange,
  helperText,
  resetSignal,
}: CaptchaWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const onTokenRef = useRef(onTokenChange);
  const hasRenderedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    onTokenRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    if (hasRenderedRef.current) {
      return;
    }

    if (!SITE_KEY) {
      setError('CAPTCHA is not configured correctly.');
      onTokenRef.current(null);
      return;
    }

    hasRenderedRef.current = true;
    let cancelled = false;

    const renderWidget = () => {
      if (!containerRef.current) {
        return;
      }
      if (
        typeof window === 'undefined' ||
        !(window as Window & { turnstile?: unknown }).turnstile
      ) {
        return;
      }

      const loaderWindow = window as Window & { turnstile: TurnstileWindow };
      if (!loaderWindow.turnstile) {
        return;
      }

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
          setError('CAPTCHA failed to load. Please retry.');
          setReady(false);
          onTokenRef.current(null);
        },
      });

      widgetIdRef.current = widgetId;
    };

    ensureTurnstileScript()
      .then(() => {
        if (cancelled) {
          return;
        }
        renderWidget();
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setError('CAPTCHA failed to load. Please retry.');
        onTokenRef.current(null);
      });

    return () => {
      cancelled = true;
    };
  }, [retryNonce]);

  useEffect(() => {
    if (resetSignal === undefined) {
      return;
    }
    if (
      widgetIdRef.current === null ||
      typeof window === 'undefined' ||
      !(window as Window & { turnstile?: unknown }).turnstile
    ) {
      return;
    }

    const loaderWindow = window as Window & { turnstile: TurnstileWindow };
    loaderWindow.turnstile.reset(widgetIdRef.current);
    setReady(false);
    onTokenRef.current(null);
  }, [resetSignal]);

  const retryCaptcha = () => {
    if (typeof document !== 'undefined') {
      document.getElementById(SCRIPT_ID)?.remove();
    }
    turnstileLoader = null;
    widgetIdRef.current = null;
    hasRenderedRef.current = false;
    setError(null);
    setReady(false);
    onTokenRef.current(null);
    setRetryNonce(prev => prev + 1);
  };

  return (
    <div className="space-y-2 px-4 py-4">
      <div ref={containerRef} />
      {helperText && <p className="text-xs text-foreground/75">{helperText}</p>}
      {error && (
        <div className="space-y-2">
          <p className="text-xs text-destructive">{error}</p>
          <p className="text-xs text-foreground/75">
            If this keeps happening, retry CAPTCHA and then refresh the page.
          </p>
          <button
            type="button"
            onClick={retryCaptcha}
            className="border-border px-2.5 py-1 text-xs text-foreground transition hover:border-info/55"
          >
            Retry CAPTCHA
          </button>
        </div>
      )}
      {!error && !ready && <p className="text-xs text-foreground/75">Loading CAPTCHA...</p>}
    </div>
  );
}
