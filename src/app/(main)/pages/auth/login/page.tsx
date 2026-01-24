import { Suspense } from 'react';
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
      <PageWrapper className="relative py-16">
        <div className="bg-[var(--hb-surface)]/95 relative isolate overflow-hidden rounded-[var(--hb-radius-lg)] border border-[var(--hb-border)] px-6 py-10 shadow-[0_25px_90px_rgba(0,0,0,0.65)] backdrop-blur-2xl md:px-12">
          <div className="bg-[var(--hb-primary-strong)]/15 pointer-events-none absolute -left-10 top-10 h-64 w-64 rounded-full blur-3xl" />
          <div className="bg-[var(--hb-primary)]/12 pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full blur-3xl" />

          <div className="relative grid items-center gap-12 md:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="bg-gradient-to-r from-[var(--hb-primary-strong)] via-[var(--hb-primary)] to-[var(--hb-accent)] bg-clip-text text-4xl font-black leading-tight text-transparent md:text-5xl">
                  Μπες ξανά στο Χομπίστας
                </h1>
                <p className="max-w-xl text-lg text-[var(--hb-muted)]">
                  Όλα τα χόμπι σου σε ένα ενιαίο περιβάλλον. <br />
                  Gaming, anime, manga, ταινίες, σειρές και βιβλία οργανωμένα, καθαρά και χωρίς
                  θόρυβο.
                </p>
              </div>

              <div className="grid gap-3 text-sm text-[var(--hb-headline)] md:grid-cols-2">
                <div className="flex items-start gap-3 rounded-2xl border border-[var(--hb-border)] bg-white/5 px-4 py-3 shadow-[0_15px_40px_rgba(0,0,0,0.35)]">
                  <div>
                    <p className="font-semibold">Ο Χομπίστας δεν είναι πλατφόρμα. Είναι χώρος.</p>
                    <p className="text-[var(--hb-muted)]">
                      Για όσους ζουν τα χόμπι τους και θέλουν να τα κρατούν οργανωμένα, καθαρά και
                      χωρίς θόρυβο.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-[var(--hb-border)] bg-white/5 px-4 py-3 shadow-[0_15px_40px_rgba(0,0,0,0.35)]">
                  <div>
                    <p className="font-semibold">Ό,τι αγαπάς, σε ένα σημείο.</p>
                    <p className="text-[var(--hb-muted)]">
                      Gaming, anime, manga, ταινίες, σειρές και βιβλία χωρίς χαμένες καρτέλες και
                      σκόρπιες λίστες.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-[var(--hb-primary-strong)]/30 absolute -right-6 bottom-6 h-16 w-16 rounded-full blur-2xl" />
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
