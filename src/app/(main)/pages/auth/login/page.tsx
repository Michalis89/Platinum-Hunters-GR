import { Suspense } from 'react';
import { Gamepad2, Film, BookOpen, Tv, Sparkles } from 'lucide-react';
import LoginForm from '@/app/components/auth/LoginForm';
import { PageWrapper } from '@/app/components/layout/PageWrapper';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Σύνδεση | Χομπίστας',
  description: 'Συνδέσου στο Χομπίστας για να οργανώσεις όλα τα χόμπι σου.',
  path: '/pages/auth/login',
  noindex: true,
});

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--hb-bg)] text-[var(--hb-text)]">
      <div className="pointer-events-none absolute inset-0 bg-[var(--hb-gradient)] opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(229,9,20,0.22),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(255,77,90,0.18),transparent_28%),radial-gradient(circle_at_65%_85%,rgba(229,9,20,0.12),transparent_32%)]" />
      <PageWrapper className="relative py-6 md:py-16">
        <div className="relative isolate overflow-hidden rounded-[var(--hb-radius-lg)] border border-[var(--hb-border)] bg-[var(--hb-surface)]/95 px-4 py-6 shadow-[0_25px_90px_rgba(0,0,0,0.65)] backdrop-blur-2xl md:px-12 md:py-10">
          <div className="pointer-events-none absolute -left-10 top-10 h-64 w-64 rounded-full bg-[var(--hb-primary-strong)]/15 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[var(--hb-primary)]/12 blur-3xl" />

          <div className="relative grid items-center gap-6 md:gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Hero content - hidden on mobile */}
            <div className="hidden space-y-6 lg:block">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--hb-primary)]">
                  Καλώς ήρθες πίσω
                </p>
                <h1 className="bg-gradient-to-r from-[var(--hb-primary-strong)] via-[var(--hb-primary)] to-[var(--hb-accent)] bg-clip-text text-4xl font-black leading-tight text-transparent md:text-5xl">
                  Συνέχισε το ταξίδι σου
                </h1>
                <p className="max-w-xl text-lg text-[var(--hb-muted)]">
                  Τα backlogs σου, οι οδηγοί σου, η πρόοδος σου. Όλα εκεί που τα άφησες.
                </p>
              </div>

              {/* Hobby Icons */}
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                  <Gamepad2 className="h-5 w-5" />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                  <Film className="h-5 w-5" />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                  <Tv className="h-5 w-5" />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>

              <div className="grid gap-3 text-sm text-[var(--hb-headline)] md:grid-cols-2">
                <div className="flex items-start gap-3 rounded-2xl border border-[var(--hb-border)] bg-white/5 px-4 py-3 shadow-[0_15px_40px_rgba(0,0,0,0.35)]">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--hb-primary)]" />
                  <div>
                    <p className="font-semibold">Η πρόοδος σου σε σε περιμένει</p>
                    <p className="text-[var(--hb-muted)]">
                      Games, anime, ταινίες, σειρές και βιβλία - όλα συγχρονισμένα.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-[var(--hb-border)] bg-white/5 px-4 py-3 shadow-[0_15px_40px_rgba(0,0,0,0.35)]">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--hb-accent)]" />
                  <div>
                    <p className="font-semibold">Χωρίς χαμένες λίστες</p>
                    <p className="text-[var(--hb-muted)]">
                      Όλα τα χόμπι σου, οργανωμένα σε ένα καθαρό dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile header */}
            <div className="text-center lg:hidden">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--hb-primary)]">
                Καλώς ήρθες πίσω
              </p>
              <h1 className="mt-2 bg-gradient-to-r from-[var(--hb-primary-strong)] via-[var(--hb-primary)] to-[var(--hb-accent)] bg-clip-text text-2xl font-black leading-tight text-transparent">
                Συνέχισε το ταξίδι σου
              </h1>
            </div>

            <div className="relative">
              <div className="absolute -right-6 bottom-6 h-16 w-16 rounded-full bg-[var(--hb-primary-strong)]/30 blur-2xl" />
              <div className="relative">
                <Suspense fallback={<div className="h-[420px]" />}>
                  <LoginForm />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}
