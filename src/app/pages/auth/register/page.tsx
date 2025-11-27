import RegisterForm from '@/app/components/auth/RegisterForm';
import { PageWrapper } from '@/app/components/layout/PageWrapper';

export const metadata = {
  title: 'Εγγραφή | Platinum Hunters GR',
  description: 'Δημιουργήστε λογαριασμό στο Platinum Hunters GR',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <PageWrapper className="py-16">
        <div className="relative isolate overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/40 px-6 py-10 shadow-2xl shadow-emerald-900/40 backdrop-blur-xl md:px-10">
          {/* Ambient glows */}
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute right-0 top-10 h-52 w-52 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute bottom-6 left-1/4 h-24 w-48 -rotate-6 rounded-full bg-cyan-500/10 blur-3xl" />
          </div>

          <div className="relative grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr]">
            {/* Hero */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">
                {' '}
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.15)]" />
                New profile • 2025
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                  Φτιάξε το προφίλ σου{' '}
                  <span className="bg-gradient-to-r from-emerald-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">
                    {' '}
                    στο Platinum Hunters
                  </span>
                </h1>
                <p className="max-w-xl text-lg text-slate-300">
                  Ενοποιημένα guides, backlog και τρόπαια σε μία εμπειρία που νιώθει native. Ξεκίνα
                  με 3 γρήγορα βήματα.
                </p>
              </div>

              <div className="grid gap-3 text-sm text-slate-200 md:grid-cols-2">
                <div className="flex items-start gap-3 rounded-xl border border-slate-800/70 bg-slate-900/60 px-4 py-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  <div>
                    <p className="font-medium text-white">Guides στο κέντρο</p>
                    <p className="text-slate-400">
                      Curated walkthroughs & tips μέσα στο app, χωρίς alt-tab
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-slate-800/70 bg-slate-900/60 px-4 py-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-sky-400" />
                  <div>
                    <p className="font-medium text-white">Backlog + trophies live</p>
                    <p className="text-slate-400">
                      Πρόοδος, ώρες και platinums συγχρονισμένα σε πραγματικό χρόνο
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-slate-800/70 bg-slate-900/60 px-4 py-3 md:col-span-2">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-400" />
                  <div>
                    <p className="font-medium text-white">Στήσε το προφίλ σου</p>
                    <p className="text-slate-400">
                      PSN IDs, αγαπημένα genres και πλατφόρμες για προτάσεις που ταιριάζουν σε σένα
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="relative">
              <div className="absolute -left-6 -top-6 h-16 w-16 rounded-2xl border border-slate-800/60 bg-slate-900/50 blur-sm" />
              <div className="absolute -right-4 bottom-6 h-14 w-14 rounded-full bg-emerald-400/20 blur-2xl" />
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
