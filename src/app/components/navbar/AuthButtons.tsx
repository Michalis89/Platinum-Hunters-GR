import Link from 'next/link';
import { LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggleButton } from './ThemeToggleButton';

type Theme = 'dark' | 'light';

type AuthButtonsProps = {
  theme: Theme;
  onToggleTheme: () => void;
};

export function AuthButtons({ theme, onToggleTheme }: AuthButtonsProps) {
  return (
    <div className="flex items-center gap-2.5">
      <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />
      <Button
        asChild
        variant="ghost"
        className="h-9 rounded-md border border-transparent bg-transparent px-2.5 text-[13px] font-medium tracking-[-0.01em] text-muted-foreground shadow-none transition-[background-color,color,opacity,transform] duration-200 [transition-timing-function:var(--easing-default)] hover:bg-[hsl(var(--accent-muted))/0.4] hover:text-primary active:scale-[0.99]"
      >
        <Link href="/auth/login">
          <LogIn className="size-4" />
          <span>Sign in</span>
        </Link>
      </Button>
      <Button
        asChild
        variant="primary"
        className="h-9 rounded-md border border-[hsl(var(--accent-primary))/0.8] bg-primary px-3 text-[13px] font-medium tracking-[-0.01em] text-primary-foreground shadow-sm transition-[background-color,border-color,transform] duration-200 [transition-timing-function:var(--easing-default)] hover:border-[hsl(var(--accent-hover))] hover:bg-[hsl(var(--accent-hover))] active:scale-[0.99]"
      >
        <Link href="/auth/register">
          <UserPlus className="size-4" />
          <span>Create account</span>
        </Link>
      </Button>
    </div>
  );
}
