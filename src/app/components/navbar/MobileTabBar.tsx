'use client';

/**
 * iOS-native bottom tab bar for mobile navigation
 * Follows Apple Human Interface Guidelines for tab bars
 * Provides quick access to primary app sections without opening menu
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Library, Newspaper, User } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/store/slices/authSlice';

type TabItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
};

const TAB_ITEMS: TabItem[] = [
  {
    href: '/home',
    label: 'Home',
    icon: Home,
    requiresAuth: false,
  },
  {
    href: '/pages/backlog',
    label: 'Library',
    icon: Library,
    requiresAuth: true,
  },
  {
    href: '/pages/news',
    label: 'News',
    icon: Newspaper,
    requiresAuth: false,
  },
  {
    href: '/pages/profile',
    label: 'Profile',
    icon: User,
    requiresAuth: true,
  },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Filter tabs based on auth status
  const visibleTabs = TAB_ITEMS.filter(tab => {
    if (tab.requiresAuth && !isAuthenticated) {
      return false;
    }
    return true;
  });

  // Don't show tab bar on certain pages
  const hideOnPaths = [
    '/pages/auth/login',
    '/pages/auth/register',
    '/pages/auth/reset-password',
    '/forgot-password',
    '/pages/auth/confirm-email',
  ];

  if (hideOnPaths.some(path => pathname?.startsWith(path))) {
    return null;
  }

  const isActive = (href: string) => {
    if (pathname === href) return true;
    if (href !== '/home' && pathname?.startsWith(href)) return true;
    return false;
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden behind tab bar */}
      <div className="h-16 md:hidden" aria-hidden="true" />

      {/* Tab Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-inset-bottom"
        aria-label="Mobile navigation"
      >
        <div className="apple-nav-shell border-t border-[var(--apple-separator)]">
          <div className="flex h-16 items-center justify-around px-2">
            {visibleTabs.map(tab => {
              const Icon = tab.icon;
              const active = isActive(tab.href);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`
                    flex min-w-[64px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-2
                    transition-colors duration-150
                    ${active
                      ? 'text-[var(--apple-system-blue)]'
                      : 'text-[var(--apple-secondary-label)] active:text-[var(--apple-label)]'
                    }
                  `}
                  aria-label={tab.label}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon
                    className={`h-6 w-6 transition-transform duration-150 ${active ? 'scale-110' : ''}`}
                    aria-hidden="true"
                  />
                  <span className="apple-caption text-[11px] font-medium tracking-tight">
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
