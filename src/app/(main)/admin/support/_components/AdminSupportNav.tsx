'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { Database, ScrollText, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        !pathname.startsWith('/admin/support/logs')),
  },
  {
    label: 'Data Curation',
    href: '/admin/support/data-curation',
    icon: Database,
    isActive: pathname => pathname.startsWith('/admin/support/data-curation'),
  },
  {
    label: 'Logs',
    href: '/admin/support/logs',
    icon: ScrollText,
    isActive: pathname => pathname.startsWith('/admin/support/logs'),
  },
];

export default function AdminSupportNav({ pathname, onNavigate }: AdminSupportNavProps) {
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
          </Link>
        );
      })}
    </nav>
  );
}
