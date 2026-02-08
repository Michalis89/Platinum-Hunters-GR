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

export function DesktopNav({
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
    <div className="hidden flex-1 items-center justify-end md:flex">
      <Menubar className="pointer-events-auto absolute left-1/2 h-11 -translate-x-1/2 items-center gap-1 rounded-[20px] border-[var(--apple-nav-border)] bg-[var(--apple-nav-pill-bg)] px-1.5 py-1 text-[var(--apple-label)] shadow-none backdrop-blur-xl">
        <LibraryMenu hobbyItems={hobbyItems} pathname={pathname} />
        {navItems.map(item => (
          <MenubarMenu key={item.href}>
            <MenubarTrigger asChild className={desktopLinkClass(isHrefActive(pathname, item.href))}>
              <Link href={item.href}>
                <NavItemContent icon={item.icon} label={item.label} />
              </Link>
            </MenubarTrigger>
          </MenubarMenu>
        ))}
      </Menubar>

      <div className="flex h-11 items-center rounded-[20px] border border-[var(--apple-nav-border)] bg-[var(--apple-nav-pill-bg)] px-1.5 text-[var(--apple-label)] backdrop-blur-xl">
        {!authResolved ? (
          <NavbarAuthSkeleton />
        ) : isAuthenticated && user ? (
          <UserMenu
            user={user}
            canQuickAdd={canQuickAdd}
            canAccessAdminPanel={canAccessAdminPanel}
            onAdd={onAdd}
            onLogout={onLogout}
            theme={theme}
            onToggleTheme={onToggleTheme}
          />
        ) : (
          <AuthButtons theme={theme} onToggleTheme={onToggleTheme} />
        )}
      </div>
    </div>
  );
}

function NavbarAuthSkeleton() {
  return (
    <div className="flex h-9 items-center gap-2 px-1">
      <div className="h-7 w-7 animate-pulse rounded-full bg-[var(--apple-nav-pill-hover)]" />
      <div className="h-4 w-24 animate-pulse rounded bg-[var(--apple-nav-pill-hover)]" />
      <div className="h-9 w-9 animate-pulse rounded-[var(--apple-radius-control)] bg-[var(--apple-nav-pill-hover)]" />
    </div>
  );
}
