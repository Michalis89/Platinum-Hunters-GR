'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectNavbarAuth } from '@/store/slices/authSlice';
import { useUserSettings } from '@/lib/settings/useUserSettings';
import { PageContainer } from './PageContainer';
import VersionBadge from '@/utils/components/VersionBadge';
import { getVisibleNavItems, type NavbarFeatureFilters } from '@/app/components/navbar/navbar.data';

const LEGAL_LINKS = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
];

const CONTACT = [
  { label: 'GitHub', href: 'https://github.com/Michalis89/hobbistas-hub' },
  { label: 'Email', href: 'mailto:mouzakitis.m89+supporthobbistas-hub@gmail.com' },
];

function FooterTextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm">
      {children}
    </Link>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useSelector(selectNavbarAuth);
  const authResolved = !isAuthLoading && (!isAuthenticated || Boolean(user));
  const { settings } = useUserSettings(isAuthenticated && authResolved);
  const isDev = process.env.NODE_ENV === 'development';

  const featureFilters = useMemo<NavbarFeatureFilters>(
    () => ({
      articles: settings?.articles_enabled ?? true,
      reviews: settings?.reviews_enabled ?? true,
    }),
    [settings?.articles_enabled, settings?.reviews_enabled],
  );

  const navLinks = useMemo(
    () =>
      getVisibleNavItems(isDev, isAuthenticated, authResolved, featureFilters).map(item => ({
        label: item.label,
        href: item.href,
      })),
    [isDev, isAuthenticated, authResolved, featureFilters],
  );

  return (
    <footer className="relative mt-auto">
      <PageContainer size="full" className="relative px-0 md:px-0">
        <div className="relative rounded-lg px-6 py-8 md:px-8 md:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,hsl(var(--primary)/0.12),transparent_46%)]" />

          <div className="relative grid gap-8 md:grid-cols-[1.55fr_1fr_1fr]">
            <section className="space-y-4">
              <Link href="/" className="inline-flex w-fit items-center gap-3 rounded-2xl px-1 py-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl text-[11px] font-semibold text-white">
                  HB
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[1.125rem] font-semibold text-foreground">Hobbistas</span>
                  <span className="text-xs font-medium">
                    <VersionBadge />
                  </span>
                </div>
              </Link>

              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                Your space for gaming, anime, manga, movies, TV series, and books. Everything
                organized without the noise.
              </p>

              <div className="flex flex-wrap gap-2">
                {CONTACT.map(contact => (
                  <Link
                    key={contact.label}
                    href={contact.href}
                    className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium"
                  >
                    {contact.label}
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
                Navigation
              </h2>

              <ul className="space-y-3">
                {navLinks.map(link => (
                  <li key={link.href}>
                    <FooterTextLink href={link.href}>{link.label}</FooterTextLink>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
                Legal
              </h2>

              <ul className="space-y-3">
                {LEGAL_LINKS.map(link => (
                  <li key={link.href}>
                    <FooterTextLink href={link.href}>{link.label}</FooterTextLink>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="mt-8 border-t pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                © {currentYear} Hobbistas. All rights reserved.
              </p>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
                {LEGAL_LINKS.map(link => (
                  <Link key={link.href} href={link.href} className="">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </footer>
  );
}
