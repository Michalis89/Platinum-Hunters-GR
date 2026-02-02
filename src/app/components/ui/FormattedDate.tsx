'use client';

import { useMemo } from 'react';
import { useMounted } from '@/lib/hooks/useMounted';

const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
};

type FormattedDateProps = {
  date?: string | null;
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
  fallback?: string;
  className?: string;
  as?: 'span' | 'time' | 'div';
};

export function FormattedDate({
  date,
  locale = 'el-GR',
  options = DEFAULT_OPTIONS,
  fallback = '—',
  className,
  as = 'span',
}: FormattedDateProps) {
  const mounted = useMounted();
  const optionsKey = useMemo(() => JSON.stringify(options), [options]);

  const formatted = useMemo(() => {
    if (!mounted || !date) {
      return fallback;
    }
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return fallback;
    }
    return new Intl.DateTimeFormat(locale, options).format(parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, date, locale, optionsKey, fallback]);

  if (as === 'time') {
    return (
      <time className={className} dateTime={date ?? undefined} suppressHydrationWarning>
        {formatted}
      </time>
    );
  }

  if (as === 'div') {
    return (
      <div className={className} suppressHydrationWarning>
        {formatted}
      </div>
    );
  }

  return (
    <span className={className} suppressHydrationWarning>
      {formatted}
    </span>
  );
}
