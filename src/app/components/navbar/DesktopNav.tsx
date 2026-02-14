import React from 'react';
import Link from 'next/link';
import type { User as UserEntity } from '@/types/user';
import { Menubar, MenubarMenu, MenubarTrigger } from '@/components/ui/menubar';
import { AuthButtons } from './AuthButtons';
import { LibraryMenu } from './LibraryMenu';
import { NavItemContent, desktopLinkClass } from './navbar.helpers';
import { isHrefActive, type HobbyItem, type NavbarLinkItem } from './navbar.data';
import { UserMenu } from './UserMenu';

type Theme = 'dark' | 'light';

type DesktopNavProps = {
  pathname: string;
  navItems: NavbarLinkItem[];
  hobbyItems: HobbyItem[];
  authResolved: boolean;
  isAuthenticated: boolean;
  user: UserEntity | null;
  canQuickAdd: boolean;
  canAccessAdminPanel: boolean;
  onAdd: () => void;
  onLogout: () => Promise<void>;
  theme: Theme;
  onToggleTheme: () => void;
};

export const DesktopNav = React.memo(function DesktopNav({
  pathname,
  navItems,
  hobbyItems,
  authResolved,
  isAuthenticated,
  user,
  canQuickAdd,
  canAccessAdminPanel,
  onAdd,
  onLogout,
  theme,
  onToggleTheme,
}: DesktopNavProps) {
  return (
    <div className="hidden w-full items-center justify-between gap-4 md:flex">
      <div className="flex flex-1 items-center justify-center">
        <Menubar className="pointer-events-auto flex h-11 items-center justify-center gap-1 rounded-[20px] border-border bg-card px-1.5 py-1 text-foreground shadow-none">
          {navItems.slice(0, 2).map(item => (
            <MenubarMenu key={item.href}>
              <MenubarTrigger asChild className={desktopLinkClass(isHrefActive(pathname, item.href))}>
                <Link href={item.href}>
                  <NavItemContent icon={item.icon} label={item.label} />
                </Link>
              </MenubarTrigger>
            </MenubarMenu>
          ))}
          {hobbyItems.length > 0 ? <LibraryMenu hobbyItems={hobbyItems} pathname={pathname} /> : null}
          {navItems.slice(2).map(item => (
            <MenubarMenu key={item.href}>
              <MenubarTrigger asChild className={desktopLinkClass(isHrefActive(pathname, item.href))}>
                <Link href={item.href}>
                  <NavItemContent icon={item.icon} label={item.label} />
                </Link>
              </MenubarTrigger>
            </MenubarMenu>
          ))}
        </Menubar>
      </div>

      <div className="pointer-events-auto relative z-20 flex h-11 items-center rounded-[20px] border border-border bg-card px-1.5 text-foreground">
        {!authResolved ? (
          <NavbarAuthSkeleton />
        ) : isAuthenticated && user ? (
          <UserMenu
            user={user}
            canQuickAdd={canQuickAdd}
            canAccessAdminPanel={canAccessAdminPanel}
            onAdd={onAdd}
            onLogout={onLogout}
          />
        ) : (
          <AuthButtons theme={theme} onToggleTheme={onToggleTheme} />
        )}
      </div>
    </div>
  );
});

function NavbarAuthSkeleton() {
  return (
    <div className="flex h-9 items-center gap-2 px-1">
      <div className="h-7 w-7 animate-pulse rounded-full bg-[hsl(var(--accent))/10]" />
      <div className="h-4 w-24 animate-pulse rounded bg-[hsl(var(--accent))/10]" />
      <div className="h-9 w-9 animate-pulse bg-[hsl(var(--accent))/10]" />
    </div>
  );
}
