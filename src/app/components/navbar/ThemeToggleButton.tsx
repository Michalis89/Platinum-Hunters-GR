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
        'h-9 rounded-full text-[var(--hb-muted)] hover:text-[var(--hb-primary-strong)]',
        className,
      )}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {!iconOnly ? <span className={cn('text-sm', labelClassName)}>{isDark ? 'Light Mode' : 'Dark Mode'}</span> : null}
    </Button>
  );
}

