import Link from 'next/link';
import { PageContainer } from './PageContainer';
import VersionBadge from '@/app/components/ui/VersionBadge';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/pages/about' },
  { label: 'Hobbies', href: '/pages/hobbies' },
  { label: 'Articles', href: '/pages/news' },
  { label: 'Reviews', href: '/pages/reviews' },
  { label: 'Support', href: '/pages/support' },
];

const LEGAL_LINKS = [
  { label: 'Terms of Service', href: '/pages/terms' },
  { label: 'Privacy Policy', href: '/pages/privacy' },
];

const CONTACT = [
  { label: 'GitHub', href: 'https://github.com/' },
  { label: 'Email', href: 'mailto:support@hobbistas-hub.com' },
];

function FooterTextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="apple-footer-link apple-focus-ring text-sm">
      {children}
    </Link>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto pt-6">
      <PageContainer size="lg" className="relative pb-8">
        <div className="apple-footer-shell relative overflow-hidden rounded-[var(--apple-radius-container)] px-6 py-8 md:px-8 md:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,color-mix(in_srgb,var(--apple-system-blue)_12%,transparent),transparent_46%)]" />

          <div className="relative grid gap-8 md:grid-cols-[1.55fr_1fr_1fr]">
            <section className="space-y-4">
              <Link
                href="/"
                className="apple-focus-ring inline-flex w-fit items-center gap-3 rounded-2xl px-1 py-1"
              >
                <div className="apple-footer-brand-badge flex h-10 w-10 items-center justify-center rounded-xl text-[11px] font-semibold text-white">
                  HB
                </div>

                <div className="flex items-center gap-2">
                  <span className="apple-title-tracking text-[1.125rem] font-semibold text-[var(--apple-label)]">
                    Hobbistas
                  </span>
                  <span className="apple-secondary-label text-xs font-medium">
                    <VersionBadge />
                  </span>
                </div>
              </Link>

              <p className="apple-body-tracking max-w-sm text-sm leading-6 text-[var(--apple-secondary-label)]">
                Your space for gaming, anime, manga, movies, TV series, and books. Everything
                organized without the noise.
              </p>

              <div className="flex flex-wrap gap-2">
                {CONTACT.map(contact => (
                  <Link
                    key={contact.label}
                    href={contact.href}
                    className="apple-footer-chip apple-focus-ring inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium"
                  >
                    {contact.label}
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <h2 className="apple-title-tracking mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--apple-label)]">
                Navigation
              </h2>

              <ul className="space-y-3">
                {NAV_LINKS.map(link => (
                  <li key={link.href}>
                    <FooterTextLink href={link.href}>{link.label}</FooterTextLink>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="apple-title-tracking mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--apple-label)]">
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

          <div className="mt-8 border-t border-[var(--apple-separator)] pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[var(--apple-secondary-label)]" suppressHydrationWarning>
                © {currentYear} Hobbistas. All rights reserved.
              </p>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
                {LEGAL_LINKS.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="apple-footer-link apple-focus-ring"
                  >
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
