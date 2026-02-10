'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store/store';
import { logout, selectNavbarAuth } from '@/store/slices/authSlice';
import { getLoginUrl, shouldRedirectToLogin } from '@/lib/routes/authRoutes';
import { useTheme } from '@/context/ThemeContext';
import { DesktopNav } from './navbar/DesktopNav';
import { LogoBrand } from './navbar/LogoBrand';
import { MobileNavSheet } from './navbar/MobileNavSheet';
import { getVisibleHobbyItems, getVisibleNavItems, HOBBY_ITEMS } from './navbar/navbar.data';

const AddArticleDialog = dynamic(() => import('./articles/AddArticleDialog'), { ssr: false });

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  const currentFullPath = queryKey ? `${pathname}?${queryKey}` : pathname;
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading: isAuthLoading, user, canQuickAdd, canAccessAdminPanel } =
    useSelector(selectNavbarAuth);
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
  }, [pathname, queryKey]);

  const handleLogout = async () => {
    await dispatch(logout());
    if (shouldRedirectToLogin(pathname)) {
      router.replace(getLoginUrl(currentFullPath));
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-2 pt-2 md:px-4 md:pt-4">
      <nav className="apple-nav-shell relative mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-2 px-2 md:px-4">
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
