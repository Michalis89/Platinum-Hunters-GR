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
    <div className="flex items-center gap-2">
      <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />
      <Button
        asChild
        variant="outline"
        className="h-9 rounded-[var(--apple-radius-control)] border-[var(--apple-nav-pill-border)] bg-[var(--apple-nav-pill-bg)] px-3 text-[13px] font-medium tracking-[-0.01em] text-[var(--apple-label)] transition-[background-color,color,border-color,transform] duration-200 [transition-timing-function:var(--hb-ease)] hover:bg-[var(--apple-nav-pill-hover)] active:scale-[0.98]"
      >
        <Link href="/pages/auth/login">
          <LogIn className="size-4" />
          <span>Sign in</span>
        </Link>
      </Button>
      <Button
        asChild
        variant="primary"
        className="h-9 rounded-[var(--apple-radius-control)] border border-transparent bg-[var(--apple-system-blue)] px-3 text-[13px] font-medium tracking-[-0.01em] text-white transition-[filter,transform] duration-200 [transition-timing-function:var(--hb-ease)] hover:brightness-110 active:scale-[0.98]"
      >
        <Link href="/pages/auth/register">
          <UserPlus className="size-4" />
          <span>Create account</span>
        </Link>
      </Button>
    </div>
  );
}
