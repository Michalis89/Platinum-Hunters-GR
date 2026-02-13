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
    'h-9  border border-transparent px-3 text-[13px] font-medium tracking-[-0.01em]',
    'transition-[background-color,color,box-shadow,transform] duration-200 [transition-timing-function:var(--easing-default)] active:scale-[0.98]',
    'focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40 focus-visible:ring-offset-0',
    isActive
      ? 'bg-[hsl(var(--accent-muted))] text-foreground shadow-[inset_0_0_0_1px_hsl(var(--border))]'
      : 'text-muted-foreground hover:bg-[hsl(var(--accent))/10] hover:text-foreground',
  );

export const mobileChipClass = (isActive: boolean, fullWidth = false) =>
  cn(
    'h-10 shrink-0  border border-[hsl(var(--border))] bg-card px-3 text-[13px] font-medium tracking-[-0.01em]',
    fullWidth && 'w-full justify-start',
    'transition-[background-color,color,border-color,transform] duration-200 [transition-timing-function:var(--easing-default)] active:scale-[0.98]',
    'focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40 focus-visible:ring-offset-0',
    isActive
      ? 'bg-[hsl(var(--accent-muted))] text-foreground'
      : 'text-foreground hover:bg-[hsl(var(--accent))/10]',
  );

export const getUserInitials = (username: string | null | undefined) => {
  if (!username) return 'H';
  return username.trim().charAt(0).toUpperCase();
};
