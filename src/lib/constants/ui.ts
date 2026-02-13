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
  pageShell: 'relative min-h-screen bg-background text-foreground',
  pageBackdrop: 'pointer-events-none absolute inset-0 opacity-70',
  pageGradient: 'absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/6',
  panelCard: 'border border-border bg-card shadow-md',
  tagPill: 'rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground',
  mutedInteractive: 'text-muted-foreground hover:text-foreground',
} as const;
