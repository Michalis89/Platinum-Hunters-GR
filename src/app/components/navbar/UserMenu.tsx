import Link from 'next/link';
import { ChevronDown, LogOut, Moon, PenLine, Plus, ShieldCheck, Sun, Ticket, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { User as UserEntity } from '@/types/user';
import { desktopLinkClass, getUserInitials } from './navbar.helpers';

type Theme = 'dark' | 'light';

type UserMenuProps = {
  user: UserEntity;
  theme: Theme;
  canQuickAdd: boolean;
  canAccessAdminPanel: boolean;
  onAdd: () => void;
  onLogout: () => Promise<void>;
  onToggleTheme: () => void;
};

const itemClassName =
  'rounded-lg px-2.5 py-2 focus:bg-white/5 focus:text-[var(--hb-primary-strong)]';

export function UserMenu({
  user,
  theme,
  canQuickAdd,
  canAccessAdminPanel,
  onAdd,
  onLogout,
  onToggleTheme,
}: UserMenuProps) {
  const fallbackInitial = getUserInitials(user.username);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className={cn(
            desktopLinkClass(false),
            'h-8 gap-2 rounded-md border-transparent bg-transparent pl-1.5 pr-2 text-[var(--hb-text)]',
          )}
        >
          <Avatar className="h-7 w-7 border border-[var(--hb-border)]">
            <AvatarImage src={user.avatar_url || undefined} alt={user.username || 'User'} />
            <AvatarFallback className="bg-white/5 text-xs font-semibold text-[var(--hb-headline)]">
              {fallbackInitial}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[130px] truncate text-sm">{user.username ?? 'Hobbistas User'}</span>
          <ChevronDown className="size-4 text-[var(--hb-muted)]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-72 rounded-2xl border-[var(--hb-border)] bg-[var(--hb-panel)] p-1.5 text-[var(--hb-text)]"
      >
        <DropdownMenuLabel className="rounded-xl px-2.5 py-2 font-normal">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-9 w-9 border border-[var(--hb-border)]">
              <AvatarImage src={user.avatar_url || undefined} alt={user.username || 'User'} />
              <AvatarFallback className="bg-white/5 text-sm font-semibold text-[var(--hb-headline)]">
                {fallbackInitial}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--hb-headline)]">
                {user.username ?? 'Hobbistas User'}
              </p>
              <p className="truncate text-xs text-[var(--hb-muted)]">{user.email ?? 'Μέλος της κοινότητας'}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[var(--hb-border)]" />
        <DropdownMenuGroup>
          {canQuickAdd ? (
            <DropdownMenuItem onSelect={onAdd} className={itemClassName}>
              <Plus className="size-4" />
              <span>Προσθήκη</span>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild className={itemClassName}>
            <Link href="/pages/profile">
              <User className="size-4" />
              <span>Προφίλ</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className={itemClassName}>
            <Link href="/pages/profile/edit">
              <PenLine className="size-4" />
              <span>Επεξεργασία Προφίλ</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className={itemClassName}>
            <Link href="/pages/support/tickets">
              <Ticket className="size-4" />
              <span>Τα tickets μου</span>
            </Link>
          </DropdownMenuItem>
          {canAccessAdminPanel ? (
            <DropdownMenuItem asChild className={itemClassName}>
              <Link href="/admin">
                <ShieldCheck className="size-4" />
                <span>Admin Panel</span>
              </Link>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-[var(--hb-border)]" />
        <DropdownMenuItem onSelect={onToggleTheme} className={itemClassName}>
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          <span>Θέμα</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[var(--hb-border)]" />
        <DropdownMenuItem
          onSelect={() => {
            void onLogout();
          }}
          className="rounded-lg px-2.5 py-2 focus:bg-white/5 focus:text-[var(--hb-accent)]"
        >
          <LogOut className="size-4" />
          <span>Έξοδος</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
