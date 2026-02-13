import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Theme = 'dark' | 'light';

type ThemeToggleButtonProps = {
  theme: Theme;
  onToggle: () => void;
  iconOnly?: boolean;
  className?: string;
  labelClassName?: string;
};

export function ThemeToggleButton({
  theme,
  onToggle,
  iconOnly = true,
  className,
  labelClassName,
}: ThemeToggleButtonProps) {
  const isDark = theme === 'dark';

  return (
    <Button
      type="button"
      onClick={onToggle}
      variant={iconOnly ? 'ghost' : 'secondary'}
      size={iconOnly ? 'icon' : 'default'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'h-11 w-11 border border-transparent text-[13px] font-medium tracking-[-0.01em] text-muted-foreground transition-[background-color,color,transform] duration-200 [transition-timing-function:var(--easing-default)] hover:bg-accent/10 hover:text-foreground active:scale-[0.98]',
        className,
      )}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {!iconOnly ? (
        <span className={cn('text-[13px] font-medium tracking-[-0.01em]', labelClassName)}>
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      ) : null}
    </Button>
  );
}
