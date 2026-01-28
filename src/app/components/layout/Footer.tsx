import Link from 'next/link';
import { Gamepad2, Heart } from 'lucide-react';
import { PageContainer } from './PageContainer';

const NAV_LINKS = [
  { label: 'Αρχική', href: '/' },
  { label: 'Σχετικά', href: '/pages/about' },
  { label: 'Χόμπι', href: '/pages/hobbies' },
  { label: 'Άρθρα', href: '/pages/news' },
  { label: 'Επικοινωνία', href: '#' },
];

const LEGAL_LINKS = [
  { label: 'Όροι χρήσης', href: '/pages/terms' },
  { label: 'Πολιτική απορρήτου', href: '/pages/privacy' },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto border-t border-[var(--hb-border)] bg-[var(--hb-bg)]">
      <div className="from-[var(--hb-primary-strong)]/[0.02] pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent" />

      <PageContainer size="lg" className="relative py-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="space-y-4">
            <Link href="/" className="group inline-flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--hb-primary-strong)] via-[var(--hb-primary)] to-[var(--hb-accent)] text-white shadow-lg transition group-hover:shadow-[0_8px_25px_rgba(229,9,20,0.4)]">
                <Gamepad2 className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-[var(--hb-headline)]">Hobbistas</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-[var(--hb-muted)]">
              Ο χώρος σου για gaming, anime, manga, ταινίες, σειρές και βιβλία. Όλα οργανωμένα,
              χωρίς θόρυβο.
            </p>
            <p className="flex items-center gap-1.5 text-xs text-[var(--hb-muted)]">
              Με <Heart className="h-3 w-3 text-[var(--hb-primary)]" /> από την Ελλάδα
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--hb-headline)]">
              Πλοήγηση
            </h4>
            <ul className="space-y-2.5">
              {NAV_LINKS.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--hb-muted)] transition hover:text-[var(--hb-headline)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--hb-headline)]">
              Νομικά
            </h4>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--hb-muted)] transition hover:text-[var(--hb-headline)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--hb-border)] pt-6 text-xs text-[var(--hb-muted)] sm:flex-row">
          <p>&copy; {currentYear} Hobbistas. Με επιφύλαξη παντός δικαιώματος.</p>
          <p>Δεν είμαστε συνδεδεμένοι με Sony Interactive Entertainment ή άλλες εταιρείες.</p>
        </div>
      </PageContainer>
    </footer>
  );
}
