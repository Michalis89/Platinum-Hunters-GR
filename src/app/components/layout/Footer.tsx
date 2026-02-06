import Link from 'next/link';
import { Gamepad2, Github, Mail } from 'lucide-react';
import { PageContainer } from './PageContainer';
import VersionBadge from '@/app/components/ui/VersionBadge';

const NAV_LINKS = [
  { label: 'Αρχική', href: '/' },
  { label: 'Σχετικά', href: '/pages/about' },
  { label: 'Χόμπι', href: '/pages/hobbies' },
  { label: 'Άρθρα', href: '/pages/news' },
  { label: 'Κριτικές', href: '/pages/reviews' },
  { label: 'Επικοινωνία', href: '/pages/support' },
];

const LEGAL_LINKS = [
  { label: 'Όροι χρήσης', href: '/pages/terms' },
  { label: 'Πολιτική απορρήτου', href: '/pages/privacy' },
];

const SOCIAL_LINKS = [
  { label: 'GitHub', href: 'https://github.com/Michalis89/hobbistas-hub', icon: Github },
  { label: 'Email', href: 'mailto:mouzakitis.m89+supporthobbistas-hub@gmail.com', icon: Mail },
];

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="focus-visible:ring-[var(--hb-primary)]/40 text-sm text-[var(--hb-muted)] underline-offset-4 transition hover:text-[var(--hb-headline)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hb-bg)]"
    >
      {children}
    </Link>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto border-t border-[var(--hb-border)] bg-[var(--hb-bg)]">
      <div className="from-[var(--hb-primary-strong)]/[0.03] pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent" />

      <PageContainer size="lg" className="relative py-12">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="group inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--hb-primary-strong)] via-[var(--hb-primary)] to-[var(--hb-accent)] text-white shadow-lg transition group-hover:shadow-[var(--hb-shadow-md-hover)]">
                <Gamepad2 className="h-5 w-5" />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-[var(--hb-headline)]">Hobbistas</span>
                <VersionBadge />
              </div>
            </Link>

            <p className="max-w-sm text-sm leading-relaxed text-[var(--hb-muted)]">
              Ο χώρος σου για gaming, anime, manga, ταινίες, σειρές και βιβλία. Όλα οργανωμένα,
              χωρίς θόρυβο.
            </p>
          </div>

          {/* Nav */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--hb-headline)]">
              Πλοήγηση
            </h4>
            <ul className="space-y-2.5">
              {NAV_LINKS.map(l => (
                <li key={l.href}>
                  <FooterLink href={l.href}>{l.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--hb-headline)]">
              Νομικά
            </h4>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map(l => (
                <li key={l.href}>
                  <FooterLink href={l.href}>{l.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--hb-headline)]">
              Επικοινωνία
            </h4>
            <ul className="space-y-2.5">
              {SOCIAL_LINKS.map(s => {
                const Icon = s.icon;
                return (
                  <li key={s.label}>
                    <Link
                      href={s.href}
                      className="focus-visible:ring-[var(--hb-primary)]/40 group inline-flex items-center gap-2 text-sm text-[var(--hb-muted)] transition hover:text-[var(--hb-headline)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hb-bg)]"
                    >
                      <Icon className="h-4 w-4 opacity-70 transition group-hover:opacity-100" />
                      <span className="underline-offset-4 group-hover:underline">{s.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col gap-4 border-t border-[var(--hb-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--hb-muted)]" suppressHydrationWarning>
            &copy; {currentYear} Hobbistas. Με επιφύλαξη παντός δικαιώματος.
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            {LEGAL_LINKS.map(l => (
              <FooterLink key={l.href} href={l.href}>
                {l.label}
              </FooterLink>
            ))}
          </div>
        </div>
      </PageContainer>
    </footer>
  );
}
