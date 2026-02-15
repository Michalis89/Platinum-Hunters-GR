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
  disabled?: boolean;
};

export function ThemeToggleButton({
  theme,
  onToggle,
  iconOnly = true,
  className,
  labelClassName,
  disabled = false,
}: ThemeToggleButtonProps) {
  const isDark = theme === 'dark';

  return (
    <Button
      type="button"
      onClick={onToggle}
      variant={iconOnly ? 'ghost' : 'secondary'}
      size={iconOnly ? 'icon' : 'default'}
      disabled={disabled}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'h-9 w-9 rounded-md border border-transparent bg-transparent text-[13px] font-medium tracking-[-0.01em] text-muted-foreground shadow-none transition-[background-color,color,opacity,transform] duration-200 [transition-timing-function:var(--easing-default)] hover:bg-[hsl(var(--accent-muted))/0.5] hover:text-primary active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60',
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
