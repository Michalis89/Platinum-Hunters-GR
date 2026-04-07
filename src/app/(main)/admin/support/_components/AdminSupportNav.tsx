'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { Database, ScrollText, Ticket, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTicketNotificationCount } from '@/lib/hooks/useTicketNotificationCount';

type AdminSupportNavProps = {
  pathname: string;
  onNavigate?: () => void;
};

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  isActive: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Tickets',
    href: '/admin/support',
    icon: Ticket,
    isActive: pathname =>
      pathname === '/admin/support' ||
      (pathname.startsWith('/admin/support/') &&
        !pathname.startsWith('/admin/support/data-curation') &&
        !pathname.startsWith('/admin/support/users') &&
        !pathname.startsWith('/admin/support/logs')),
  },
  {
    label: 'Data Curation',
    href: '/admin/support/data-curation',
    icon: Database,
    isActive: pathname => pathname.startsWith('/admin/support/data-curation'),
  },
  {
    label: 'Users',
    href: '/admin/support/users',
    icon: Users,
    isActive: pathname => pathname.startsWith('/admin/support/users'),
  },
  {
    label: 'Logs',
    href: '/admin/support/logs',
    icon: ScrollText,
    isActive: pathname => pathname.startsWith('/admin/support/logs'),
  },
];

export default function AdminSupportNav({ pathname, onNavigate }: AdminSupportNavProps) {
  const { adminCount: ticketUnreadCount } = useTicketNotificationCount();

  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map(item => {
        const active = item.isActive(pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'border-primary/40 bg-primary/15 text-foreground'
                : 'border-transparent text-muted-foreground hover:border-border hover:bg-card hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
            {item.href === '/admin/support' && ticketUnreadCount > 0 ? (
              <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold leading-5 text-destructive-foreground">
                {ticketUnreadCount > 99 ? '99+' : ticketUnreadCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
