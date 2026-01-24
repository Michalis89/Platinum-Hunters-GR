import { UserPlus, Library, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';

type Step = {
  number: string;
  title: string;
  description: string;
  icon: ReactNode;
};

const steps: Step[] = [
  {
    number: '01',
    title: 'Δημιούργησε λογαριασμό',
    description:
      'Γρήγορη εγγραφή σε δευτερόλεπτα. Αμέσως πρόσβαση στο backlog και τους οδηγούς.',
    icon: <UserPlus className="h-6 w-6" />,
  },
  {
    number: '02',
    title: 'Πρόσθεσε τα hobbies σου',
    description:
      'Games, anime, ταινίες — προσθέτεις ό,τι παρακολουθείς με status και notes.',
    icon: <Library className="h-6 w-6" />,
  },
  {
    number: '03',
    title: 'Παρακολούθησε την πρόοδο',
    description:
      'Ενημερώνεις με ένα click. Βλέπεις στατιστικά και συνεχίζεις στο επόμενο.',
    icon: <TrendingUp className="h-6 w-6" />,
  },
];

export function HomeHowItWorks() {
  return (
    <section className="relative px-4 py-16 md:px-6 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[var(--hb-primary-strong)]/[0.02] to-transparent" />

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-10 text-center md:mb-14">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--hb-primary-strong)]">
            Πώς λειτουργεί
          </p>
          <h2 className="mb-4 text-3xl font-bold text-[var(--hb-headline)] md:text-4xl">
            Τρία απλά βήματα
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-14 hidden h-px w-full -translate-x-1/2 bg-gradient-to-r from-[var(--hb-border)] via-[var(--hb-primary-strong)]/30 to-[var(--hb-border)] md:block" />
              )}

              <div className="relative flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] text-[var(--hb-primary-strong)] shadow-[0_12px_30px_rgba(3,7,18,0.35)]">
                    {step.icon}
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--hb-primary-strong)] text-[10px] font-bold text-white">
                    {step.number}
                  </span>
                </div>

                <h3 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--hb-muted)]">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
