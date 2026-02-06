/**
 * UI Constants
 * Centralized UI-related constants (date formats, etc.)
 */

// Date/time formatting options
export const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

// Reusable Tailwind class patterns
export const UI_CLASSNAMES = {
  pageShell: 'relative min-h-screen bg-[var(--hb-bg)] text-[var(--hb-text)]',
  pageBackdrop: 'pointer-events-none absolute inset-0 overflow-hidden opacity-70',
  pageGradient: 'absolute inset-0 bg-[var(--hb-gradient)] blur-[100px]',
  panelCard: 'border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[var(--hb-shadow-md)]',
  tagPill:
    'rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 py-1 text-xs text-[var(--hb-text)]',
  mutedInteractive: 'text-[var(--hb-muted)] hover:text-[var(--hb-headline)]',
} as const;
