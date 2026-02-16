export const SUPPORT_STATUS_OPTIONS = [
  'open',
  'in_progress',
  'waiting_user',
  'resolved',
  'closed',
] as const;

export type SupportStatus = (typeof SUPPORT_STATUS_OPTIONS)[number];

export const SUPPORT_CATEGORY_OPTIONS = ['bug', 'feature', 'author_rights', 'general'] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORY_OPTIONS)[number];

export const SUPPORT_SEVERITY_OPTIONS = ['low', 'medium', 'high', 'critical'] as const;

export type SupportSeverity = (typeof SUPPORT_SEVERITY_OPTIONS)[number];

export const SUPPORT_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In progress',
  waiting_user: 'Reply from user',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const SUPPORT_STATUS_COLORS: Record<string, string> = {
  open: 'blue',
  in_progress: 'yellow',
  waiting_user: 'yellow',
  resolved: 'green',
  closed: 'gray',
};

export const SUPPORT_CATEGORY_LABELS: Record<string, string> = {
  bug: 'Error',
  feature: 'Suggestion',
  author_rights: 'Author rights',
  general: 'General',
};

export const SUPPORT_SEVERITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};
