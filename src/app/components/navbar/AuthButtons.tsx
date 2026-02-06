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
      <Button asChild variant="outline" className="h-9 rounded-full px-3">
        <Link href="/pages/auth/login">
          <LogIn className="size-4" />
          <span>Σύνδεση</span>
        </Link>
      </Button>
      <Button asChild variant="primary" className="h-9 rounded-full px-3">
        <Link href="/pages/auth/register">
          <UserPlus className="size-4" />
          <span>Εγγραφή</span>
        </Link>
      </Button>
    </div>
  );
}

