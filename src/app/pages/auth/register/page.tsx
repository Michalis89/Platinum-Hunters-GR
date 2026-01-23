import RegisterForm from '@/app/components/auth/RegisterForm';
import { PageWrapper } from '@/app/components/layout/PageWrapper';

export const metadata = {
  title: 'Εγγραφή | Hobistas',
  description: 'Δημιουργήστε λογαριασμό στο Hobistas — το hub για όλα τα χόμπι σας.',
};

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--hb-bg)] text-[var(--hb-text)]">
      <div className="pointer-events-none absolute inset-0 bg-[var(--hb-gradient)] opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(229,9,20,0.18),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(255,77,90,0.16),transparent_28%),radial-gradient(circle_at_70%_80%,rgba(229,9,20,0.12),transparent_32%)]" />
      <PageWrapper className="relative py-16">
        <div className="bg-[var(--hb-surface)]/95 relative isolate overflow-hidden rounded-[var(--hb-radius-lg)] border border-[var(--hb-border)] px-6 py-10 shadow-[0_25px_90px_rgba(0,0,0,0.65)] backdrop-blur-2xl md:px-12">
          <div className="bg-[var(--hb-primary-strong)]/12 pointer-events-none absolute -left-12 top-4 h-72 w-72 rounded-full blur-3xl" />
          <div className="bg-[var(--hb-primary)]/12 pointer-events-none absolute bottom-2 right-0 h-80 w-80 rounded-full blur-3xl" />

          <div className="relative grid items-center gap-12 md:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl font-black leading-tight bg-gradient-to-r from-[var(--hb-primary-strong)] via-[var(--hb-primary)] to-[var(--hb-accent)] bg-clip-text text-transparent md:text-5xl">
                  Φτιάξε το προφίλ σου στο Hobistas
                </h1>
                <p className="max-w-xl text-lg text-[var(--hb-muted)]">
                  3 βήματα, ένα σκοτεινό UI και ενιαίο dashboard για guides, backlog και lists σε
                  gaming, σειρές, βιβλία. Εστιασμένη εμπειρία τύπου Netflix.
                </p>
              </div>

              <div className="grid gap-3 text-sm text-[var(--hb-headline)] md:grid-cols-2">
                <div className="flex items-start gap-3 rounded-2xl border border-[var(--hb-border)] bg-white/5 px-4 py-3 shadow-[0_15px_40px_rgba(0,0,0,0.35)]">
                  <div className="mt-1 h-2 w-2 rounded-full bg-[var(--hb-primary)]" />
                  <div>
                    <p className="font-semibold">Guides curated</p>
                    <p className="text-[var(--hb-muted)]">
                      Walkthroughs χωρίς alt-tab, με focus σε κάθε χόμπι που παρακολουθείς.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-[var(--hb-border)] bg-white/5 px-4 py-3 shadow-[0_15px_40px_rgba(0,0,0,0.35)]">
                  <div className="mt-1 h-2 w-2 rounded-full bg-[var(--hb-accent)]" />
                  <div>
                    <p className="font-semibold">Backlog + progress live</p>
                    <p className="text-[var(--hb-muted)]">
                      Προόδους, ώρες και συλλογές σε πραγματικό χρόνο, με PSN sync όπου χρειάζεται.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-[var(--hb-border)] bg-white/5 px-4 py-3 shadow-[0_15px_40px_rgba(0,0,0,0.35)] md:col-span-2">
                  <div className="mt-1 h-2 w-2 rounded-full bg-white" />
                  <div>
                    <p className="font-semibold">Στήσε το προφίλ σου</p>
                    <p className="text-[var(--hb-muted)]">
                      PSN IDs, αγαπημένα genres, πλατφόρμες και μέσα για προτάσεις που ταιριάζουν σε
                      σένα.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-[var(--hb-primary-strong)]/30 absolute -right-6 bottom-6 h-16 w-16 rounded-full blur-2xl" />
              <div className="relative">
                <RegisterForm />
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}
