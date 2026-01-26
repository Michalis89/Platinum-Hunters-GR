import { Suspense } from 'react';
import { Gamepad2, Film, BookOpen, Tv, Sparkles, Trophy, ListChecks, Heart } from 'lucide-react';
import RegisterForm from '@/app/components/auth/RegisterForm';
import { PageWrapper } from '@/app/components/layout/PageWrapper';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Εγγραφή | Χομπίστας',
  description: 'Δημιούργησε λογαριασμό στον Χομπίστα για να οργανώσεις τα χόμπι σου.',
  path: '/pages/auth/register',
  noindex: true,
});

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--hb-bg)] text-[var(--hb-text)]">
      <div className="pointer-events-none absolute inset-0 bg-[var(--hb-gradient)] opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(229,9,20,0.18),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(255,77,90,0.16),transparent_28%),radial-gradient(circle_at_70%_80%,rgba(229,9,20,0.12),transparent_32%)]" />
      <PageWrapper className="relative py-16">
        <div className="relative isolate overflow-hidden rounded-[var(--hb-radius-lg)] border border-[var(--hb-border)] bg-[var(--hb-surface)]/95 px-6 py-10 shadow-[0_25px_90px_rgba(0,0,0,0.65)] backdrop-blur-2xl md:px-12">
          <div className="pointer-events-none absolute -left-12 top-4 h-72 w-72 rounded-full bg-[var(--hb-primary-strong)]/12 blur-3xl" />
          <div className="pointer-events-none absolute bottom-2 right-0 h-80 w-80 rounded-full bg-[var(--hb-primary)]/12 blur-3xl" />

          <div className="relative grid items-center gap-12 md:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--hb-primary)]">
                  Γίνε μέλος
                </p>
                <h1 className="bg-gradient-to-r from-[var(--hb-primary-strong)] via-[var(--hb-primary)] to-[var(--hb-accent)] bg-clip-text text-4xl font-black leading-tight text-transparent md:text-5xl">
                  Ξεκίνα το ταξίδι σου
                </h1>
                <p className="max-w-xl text-lg text-[var(--hb-muted)]">
                  Ένα dashboard για όλα τα χόμπι σου. Οργάνωσε, παρακολούθησε και ανακάλυψε.
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
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                    <ListChecks className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold">Ενιαίο Backlog</p>
                    <p className="text-[var(--hb-muted)]">
                      Games, anime, ταινίες, σειρές και βιβλία σε ένα σημείο.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-[var(--hb-border)] bg-white/5 px-4 py-3 shadow-[0_15px_40px_rgba(0,0,0,0.35)]">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                    <Trophy className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold">Πρόοδος & Στατιστικά</p>
                    <p className="text-[var(--hb-muted)]">
                      Ώρες, επεισόδια, σελίδες - παρακολούθησε τα πάντα.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-[var(--hb-border)] bg-white/5 px-4 py-3 shadow-[0_15px_40px_rgba(0,0,0,0.35)] md:col-span-2">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
                    <Heart className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold">Προσωποποιημένες Προτάσεις</p>
                    <p className="text-[var(--hb-muted)]">
                      Ανακάλυψε νέο περιεχόμενο βασισμένο στα γούστα σου και στα χόμπι που ασχολείσαι.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -right-6 bottom-6 h-16 w-16 rounded-full bg-[var(--hb-primary-strong)]/30 blur-2xl" />
              <div className="relative">
                <Suspense fallback={<div className="h-[420px]" />}>
                  <RegisterForm />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}
