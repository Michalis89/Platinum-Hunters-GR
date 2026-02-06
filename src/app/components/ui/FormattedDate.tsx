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
  // Format date server-side
  const formatted = (() => {
    if (!date) {
      return fallback;
    }
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return fallback;
    }
    return new Intl.DateTimeFormat(locale, options).format(parsed);
  })();

  // suppressHydrationWarning handles potential timezone differences between server/client
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
