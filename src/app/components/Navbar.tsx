'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store/store';
import {
  logout,
  selectCanAccessAdminPanel,
  selectCanQuickAdd,
  selectIsAuthenticated,
  selectIsLoading,
  selectUser,
} from '@/store/slices/authSlice';
import { useTheme } from '@/context/ThemeContext';
import { DesktopNav } from './navbar/DesktopNav';
import { LogoBrand } from './navbar/LogoBrand';
import { MobileNavSheet } from './navbar/MobileNavSheet';
import { getVisibleHobbyItems, getVisibleNavItems, HOBBY_ITEMS } from './navbar/navbar.data';

const AddArticleDialog = dynamic(() => import('./articles/AddArticleDialog'), { ssr: false });

export default function Navbar() {
  const pathname = usePathname() || '';
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAuthLoading = useSelector(selectIsLoading);
  const user = useSelector(selectUser);
  const canQuickAdd = useSelector(selectCanQuickAdd);
  const canAccessAdminPanel = useSelector(selectCanAccessAdminPanel);
  const { theme, toggleTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const isDev = process.env.NODE_ENV === 'development';
  const authResolved = !isAuthLoading && (!isAuthenticated || Boolean(user));
  const logoHref = authResolved && isAuthenticated ? '/dashboard' : '/home';
  const userCategories = useMemo(() => user?.categories ?? [], [user?.categories]);

  const navItems = useMemo(
    () => getVisibleNavItems(isDev, isAuthenticated, authResolved),
    [isDev, isAuthenticated, authResolved],
  );
  const hobbyItems = useMemo(
    () => getVisibleHobbyItems(HOBBY_ITEMS, authResolved, isAuthenticated, userCategories),
    [authResolved, isAuthenticated, userCategories],
  );

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await dispatch(logout());
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--hb-border)] bg-[var(--hb-surface)]/95 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <LogoBrand href={logoHref} />

        <DesktopNav
          pathname={pathname}
          navItems={navItems}
          hobbyItems={hobbyItems}
          authResolved={authResolved}
          isAuthenticated={isAuthenticated}
          user={user}
          canQuickAdd={canQuickAdd}
          canAccessAdminPanel={canAccessAdminPanel}
          onAdd={() => setAddDialogOpen(true)}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <MobileNavSheet
          open={mobileOpen}
          onOpenChange={setMobileOpen}
          pathname={pathname}
          hobbyItems={hobbyItems}
          navItems={navItems}
          authResolved={authResolved}
          isAuthenticated={isAuthenticated}
          user={user}
          canQuickAdd={canQuickAdd}
          canAccessAdminPanel={canAccessAdminPanel}
          onAdd={() => setAddDialogOpen(true)}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </nav>

      {addDialogOpen ? (
        <AddArticleDialog isOpen={addDialogOpen} onClose={() => setAddDialogOpen(false)} onSuccess={() => {}} />
      ) : null}
    </header>
  );
}
