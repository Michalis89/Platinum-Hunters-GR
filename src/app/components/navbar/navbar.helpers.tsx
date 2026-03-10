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
      <span className="cursor-pointer leading-none">{label}</span>
    </span>
  );
}

export const desktopLinkClass = (isActive: boolean) =>
  cn(
    'relative h-10 cursor-pointer border border-transparent px-1 text-[13px] tracking-[-0.01em]',
    'rounded-none bg-transparent',
    'after:absolute after:bottom-[2px] after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-200 [transition-timing-function:var(--easing-default)]',
    'transition-[color,opacity,transform] duration-200 [transition-timing-function:var(--easing-default)] active:scale-[0.99]',
    'focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40 focus-visible:ring-offset-0',
    'focus:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-foreground',
    isActive
      ? 'font-semibold text-foreground after:scale-x-100'
      : 'font-medium text-muted-foreground hover:text-foreground hover:after:scale-x-100',
  );

export const mobileChipClass = (isActive: boolean, fullWidth = false) =>
  cn(
    'h-10 shrink-0 cursor-pointer border border-[hsl(var(--border))] bg-card px-3 text-[13px] font-medium tracking-[-0.01em]',
    fullWidth && 'w-full justify-start',
    'transition-[background-color,color,border-color,transform] duration-200 [transition-timing-function:var(--easing-default)] active:scale-[0.98]',
    'focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40 focus-visible:ring-offset-0',
    isActive
      ? 'bg-[hsl(var(--accent-muted))] text-foreground'
      : 'text-foreground hover:bg-[hsl(var(--accent))/10]',
  );

export const getUserInitials = (username: string | null | undefined) => {
  if (!username) {
    return 'H';
  }
  return username.trim().charAt(0).toUpperCase();
};
