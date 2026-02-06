import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NavItemContent({
  icon: Icon,
  label,
  iconClassName,
  className,
}: {
  icon: LucideIcon;
  label: string;
  iconClassName?: string;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Icon className={cn('size-4', iconClassName)} />
      <span>{label}</span>
    </span>
  );
}

export const desktopLinkClass = (isActive: boolean) =>
  cn(
    'h-9 rounded-full border px-3 text-sm',
    'focus-visible:ring-2 focus-visible:ring-[var(--hb-ring)] focus-visible:ring-offset-0',
    isActive
      ? 'border-[var(--hb-border)] bg-white/5 text-[var(--hb-primary-strong)] shadow-[var(--hb-shadow-md)]'
      : 'border-transparent text-[var(--hb-muted)] hover:border-[var(--hb-border)] hover:bg-white/5 hover:text-[var(--hb-primary-strong)]',
  );

export const mobileChipClass = (isActive: boolean, fullWidth = false) =>
  cn(
    'h-9 shrink-0 rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 text-sm',
    fullWidth && 'w-full justify-start',
    'focus-visible:ring-2 focus-visible:ring-[var(--hb-ring)] focus-visible:ring-offset-0',
    isActive
      ? 'text-[var(--hb-primary-strong)] shadow-[var(--hb-shadow-md)]'
      : 'text-[var(--hb-text)] hover:text-[var(--hb-primary-strong)]',
  );

export const getUserInitials = (username: string | null | undefined) => {
  if (!username) return 'H';
  return username.trim().charAt(0).toUpperCase();
};
