/**
 * Support Ticket Constants
 * Centralized constants for support ticket system
 */

// Status options
export const SUPPORT_STATUS_OPTIONS = [
  'open',
  'in_progress',
  'waiting_user',
  'resolved',
  'closed',
] as const;

export type SupportStatus = (typeof SUPPORT_STATUS_OPTIONS)[number];

// Category options
export const SUPPORT_CATEGORY_OPTIONS = ['bug', 'feature', 'author_rights', 'general'] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORY_OPTIONS)[number];

// Severity options
export const SUPPORT_SEVERITY_OPTIONS = ['low', 'medium', 'high', 'critical'] as const;

export type SupportSeverity = (typeof SUPPORT_SEVERITY_OPTIONS)[number];

// Status labels (Greek translations)
export const SUPPORT_STATUS_LABELS: Record<string, string> = {
  open: 'Ανοικτό',
  in_progress: 'Σε εξέλιξη',
  waiting_user: 'Απάντηση από χρήστη',
  resolved: 'Επιλύθηκε',
  closed: 'Κλειστό',
};

// Status colors for UI
export const SUPPORT_STATUS_COLORS: Record<string, string> = {
  open: 'blue',
  in_progress: 'yellow',
  waiting_user: 'yellow',
  resolved: 'green',
  closed: 'gray',
};

// Category labels (Greek translations)
export const SUPPORT_CATEGORY_LABELS: Record<string, string> = {
  bug: 'Σφάλμα',
  feature: 'Πρόταση',
  author_rights: 'Δικαιώματα Author',
  general: 'Γενικά',
};

// Severity labels (Greek translations)
export const SUPPORT_SEVERITY_LABELS: Record<string, string> = {
  low: 'Χαμηλή',
  medium: 'Μεσαία',
  high: 'Υψηλή',
  critical: 'Κρίσιμη',
};
