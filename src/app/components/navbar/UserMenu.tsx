import React from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  LogOut,
  PenLine,
  Plus,
  Settings,
  ShieldCheck,
  Ticket,
  User,
} from 'lucide-react';
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

type UserMenuProps = {
  user: UserEntity;
  canQuickAdd: boolean;
  canAccessAdminPanel: boolean;
  onAdd: () => void;
  onLogout: () => Promise<void>;
};

const itemClassName =
  ' px-2.5 py-2 text-[13px] font-medium tracking-[-0.01em] transition-[background-color,color] duration-200 [transition-timing-function:var(--easing-default)] focus:bg-accent/10 focus:text-foreground';

export const UserMenu = React.memo(function UserMenu({
  user,
  canQuickAdd,
  canAccessAdminPanel,
  onAdd,
  onLogout,
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
            'h-9 gap-2 border-transparent bg-transparent pl-1.5 pr-2 text-[13px] font-medium tracking-[-0.01em] text-foreground',
          )}
        >
          <Avatar className="h-7 w-7 border border-border">
            <AvatarImage src={user.avatar_url || undefined} alt={user.username || 'User'} />
            <AvatarFallback className="bg-accent/10 text-xs font-semibold text-foreground">
              {fallbackInitial}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[130px] truncate text-[13px] font-medium tracking-[-0.01em]">
            {user.username ?? 'Hobbistas User'}
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-72 p-1.5 text-foreground">
        <DropdownMenuLabel className="rounded-lg px-2.5 py-2 font-normal">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src={user.avatar_url || undefined} alt={user.username || 'User'} />
              <AvatarFallback className="bg-accent/10 text-sm font-semibold text-foreground">
                {fallbackInitial}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {user.username ?? 'Hobbistas User'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email ?? 'Community member'}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="h-[0.5px] bg-[var(--border)]" />
        <DropdownMenuGroup>
          {canQuickAdd ? (
            <DropdownMenuItem onSelect={onAdd} className={itemClassName}>
              <Plus className="size-4" />
              <span>Quick add</span>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild className={itemClassName}>
            <Link href="/pages/profile" prefetch={false}>
              <User className="size-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className={itemClassName}>
            <Link href="/pages/profile/edit" prefetch={false}>
              <PenLine className="size-4" />
              <span>Edit profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className={itemClassName}>
            <Link href="/settings" prefetch={false}>
              <Settings className="size-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className={itemClassName}>
            <Link href="/pages/support/tickets" prefetch={false}>
              <Ticket className="size-4" />
              <span>My tickets</span>
            </Link>
          </DropdownMenuItem>
          {canAccessAdminPanel ? (
            <DropdownMenuItem asChild className={itemClassName}>
              <Link href="/admin" prefetch={false}>
                <ShieldCheck className="size-4" />
                <span>Admin Panel</span>
              </Link>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="h-[0.5px] bg-[var(--border)]" />
        <DropdownMenuSeparator className="h-[0.5px] bg-[var(--border)]" />
        <DropdownMenuItem
          onSelect={() => {
            void onLogout();
          }}
          className={itemClassName}
        >
          <LogOut className="size-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
