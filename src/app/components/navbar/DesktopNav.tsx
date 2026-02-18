import React from 'react';
import Link from 'next/link';
import { ChevronDown, Dice5 } from 'lucide-react';
import type { User as UserEntity } from '@/types/user';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { AuthButtons } from './AuthButtons';
import { LibraryMenu } from './LibraryMenu';
import { NavItemContent, desktopLinkClass } from './navbar.helpers';
import { isHrefActive, type DndToolItem, type HobbyItem, type NavbarLinkItem } from './navbar.data';
import { ThemeToggleButton } from './ThemeToggleButton';
import { UserMenu } from './UserMenu';

type Theme = 'dark' | 'light';

type DesktopNavProps = {
  pathname: string;
  navItems: NavbarLinkItem[];
  hobbyItems: HobbyItem[];
  dndTools: DndToolItem[];
  dndEnabled: boolean;
  authResolved: boolean;
  isAuthenticated: boolean;
  user: UserEntity | null;
  canQuickAdd: boolean;
  canAccessAdminPanel: boolean;
  userTicketUnreadCount: number;
  adminTicketUnreadCount: number;
  hasAnyTicketUnread: boolean;
  onAdd: () => void;
  onLogout: () => Promise<void>;
  theme: Theme;
  onToggleTheme: () => void;
  isThemeSaving: boolean;
};

export const DesktopNav = React.memo(function DesktopNav({
  pathname,
  navItems,
  hobbyItems,
  dndTools,
  dndEnabled,
  authResolved,
  isAuthenticated,
  user,
  canQuickAdd,
  canAccessAdminPanel,
  userTicketUnreadCount,
  adminTicketUnreadCount,
  hasAnyTicketUnread,
  onAdd,
  onLogout,
  theme,
  onToggleTheme,
  isThemeSaving,
}: DesktopNavProps) {
  return (
    <div className="hidden w-full items-center gap-6 md:flex">
      <div className="flex min-w-0 flex-1 items-center justify-center">
        <Menubar className="pointer-events-auto flex h-auto items-center justify-center gap-6 rounded-none border-0 bg-transparent p-0 text-foreground shadow-none">
          {navItems.slice(0, 2).map(item => (
            <MenubarMenu key={item.href}>
              <MenubarTrigger
                asChild
                className={desktopLinkClass(isHrefActive(pathname, item.href))}
              >
                <Link href={item.href}>
                  <NavItemContent icon={item.icon} label={item.label} />
                </Link>
              </MenubarTrigger>
            </MenubarMenu>
          ))}
          {hobbyItems.length > 0 ? (
            <LibraryMenu hobbyItems={hobbyItems} pathname={pathname} />
          ) : null}
          {dndEnabled && dndTools.length > 0 && (
            <MenubarMenu>
              <MenubarTrigger
                className={`${desktopLinkClass(pathname.startsWith('/dnd'))} gap-2`}
                aria-label="Open D&D menu"
              >
                <Dice5 className="size-4" />
                <span>D&D</span>
                <ChevronDown className="ml-1 size-4 text-muted-foreground/90 transition-opacity duration-200" />
              </MenubarTrigger>
              <MenubarContent className="w-64 p-1.5 text-foreground">
                {dndTools.map(tool => {
                  const Icon = tool.icon;
                  const active = isHrefActive(pathname, tool.href);
                  return (
                    <MenubarItem
                      key={tool.href}
                      asChild
                      className="px-2.5 py-2 text-[13px] font-medium tracking-[-0.01em] transition-[background-color,color] duration-200 [transition-timing-function:var(--easing-default)] focus:bg-[hsl(var(--accent))/10] focus:text-foreground"
                    >
                      <Link
                        href={tool.href}
                        className={active ? 'text-foreground' : 'text-muted-foreground'}
                      >
                        <NavItemContent icon={Icon} label={tool.label} />
                      </Link>
                    </MenubarItem>
                  );
                })}
              </MenubarContent>
            </MenubarMenu>
          )}
          {navItems.slice(2).map(item => (
            <MenubarMenu key={item.href}>
              <MenubarTrigger
                asChild
                className={desktopLinkClass(isHrefActive(pathname, item.href))}
              >
                <Link href={item.href}>
                  <NavItemContent icon={item.icon} label={item.label} />
                </Link>
              </MenubarTrigger>
            </MenubarMenu>
          ))}
        </Menubar>
      </div>

      <div className="pointer-events-auto relative z-20 flex h-10 shrink-0 items-center gap-2 text-foreground">
        {!authResolved ? (
          <NavbarAuthSkeleton />
        ) : isAuthenticated && user ? (
          <>
            <ThemeToggleButton
              theme={theme}
              onToggle={onToggleTheme}
              disabled={isThemeSaving}
              className="h-8 w-8"
            />
            <UserMenu
              user={user}
              canQuickAdd={canQuickAdd}
              canAccessAdminPanel={canAccessAdminPanel}
              userTicketUnreadCount={userTicketUnreadCount}
              adminTicketUnreadCount={adminTicketUnreadCount}
              hasAnyTicketUnread={hasAnyTicketUnread}
              onAdd={onAdd}
              onLogout={onLogout}
            />
          </>
        ) : (
          <AuthButtons theme={theme} onToggleTheme={onToggleTheme} />
        )}
      </div>
    </div>
  );
});

function NavbarAuthSkeleton() {
  return (
    <div className="flex h-9 items-center gap-2">
      <div className="h-9 w-9 animate-pulse rounded-md bg-[hsl(var(--accent))/10]" />
      <div className="h-4 w-24 animate-pulse rounded bg-[hsl(var(--accent))/10]" />
      <div className="h-9 w-9 animate-pulse rounded-md bg-[hsl(var(--accent))/10]" />
    </div>
  );
}
