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
    <div className="hidden flex-1 items-center justify-between gap-4 md:flex">
      <Menubar className="ml-8 h-10 items-center gap-1 rounded-lg border-[var(--hb-border)] bg-[var(--hb-panel)] px-1 py-1 shadow-none">
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

      <div className="flex h-10 items-center rounded-lg border border-[var(--hb-border)] bg-[var(--hb-panel)] px-1.5">
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
      <div className="h-7 w-7 animate-pulse rounded-full bg-white/10" />
      <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
      <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
    </div>
  );
}
