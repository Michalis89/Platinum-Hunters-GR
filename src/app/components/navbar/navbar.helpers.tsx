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
    <span className={cn('inline-flex items-center gap-2 leading-none', className)}>
      <Icon className={cn('size-4 shrink-0', iconClassName)} />
      <span className="leading-none">{label}</span>
    </span>
  );
}

export const desktopLinkClass = (isActive: boolean) =>
  cn(
    'h-9 rounded-[var(--apple-radius-control)] border border-transparent px-3 text-[13px] font-medium tracking-[-0.01em]',
    'transition-[background-color,color,box-shadow,transform] duration-200 [transition-timing-function:var(--hb-ease)] active:scale-[0.98]',
    'focus-visible:ring-2 focus-visible:ring-[var(--apple-system-blue)]/40 focus-visible:ring-offset-0',
    isActive
      ? 'bg-[var(--apple-nav-pill-active)] text-[var(--apple-label)] shadow-[inset_0_0_0_var(--apple-hairline)_var(--apple-nav-pill-border)]'
      : 'text-[var(--apple-secondary-label)] hover:bg-[var(--apple-nav-pill-hover)] hover:text-[var(--apple-label)]',
  );

export const mobileChipClass = (isActive: boolean, fullWidth = false) =>
  cn(
    'h-10 shrink-0 rounded-[var(--apple-radius-control)] border border-[var(--apple-nav-pill-border)] bg-[var(--apple-nav-pill-bg)] px-3 text-[13px] font-medium tracking-[-0.01em]',
    fullWidth && 'w-full justify-start',
    'transition-[background-color,color,border-color,transform] duration-200 [transition-timing-function:var(--hb-ease)] active:scale-[0.98]',
    'focus-visible:ring-2 focus-visible:ring-[var(--apple-system-blue)]/40 focus-visible:ring-offset-0',
    isActive
      ? 'bg-[var(--apple-nav-pill-active)] text-[var(--apple-label)]'
      : 'text-[var(--apple-label)] hover:bg-[var(--apple-nav-pill-hover)]',
  );

export const getUserInitials = (username: string | null | undefined) => {
  if (!username) return 'H';
  return username.trim().charAt(0).toUpperCase();
};
