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
    description: 'Γρήγορη εγγραφή σε δευτερόλεπτα. Αμέσως πρόσβαση στο backlog και τους οδηγούς.',
    icon: <UserPlus className="h-6 w-6" />,
  },
  {
    number: '02',
    title: 'Πρόσθεσε τα hobbies σου',
    description: 'Games, anime, ταινίες — προσθέτεις ό,τι παρακολουθείς με status και notes.',
    icon: <Library className="h-6 w-6" />,
  },
  {
    number: '03',
    title: 'Παρακολούθησε την πρόοδο',
    description: 'Ενημερώνεις με ένα click. Βλέπεις στατιστικά και συνεχίζεις στο επόμενο.',
    icon: <TrendingUp className="h-6 w-6" />,
  },
];

export function HomeHowItWorks() {
  return (
    <section className="relative px-4 py-12 md:px-6 md:py-16">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[color-mix(in_srgb,var(--apple-system-blue)_4%,transparent)] to-transparent" />

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-10 text-center md:mb-12">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--apple-system-blue)]">
            Πώς λειτουργεί
          </p>
          <h2 className="apple-title-tracking mb-4 text-3xl font-semibold text-[var(--apple-label)] md:text-4xl">
            Τρία απλά βήματα
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-14 hidden h-px w-full -translate-x-1/2 bg-gradient-to-r from-[var(--apple-separator)] via-[color-mix(in_srgb,var(--apple-system-blue)_18%,var(--apple-separator))] to-[var(--apple-separator)] md:block" />
              )}

              <div className="apple-card relative flex flex-col items-center rounded-[var(--apple-radius-card)] p-6 text-center">
                <div className="relative mb-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)] text-[var(--apple-system-blue)] shadow-[var(--hb-shadow-sm)]">
                    {step.icon}
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--apple-system-blue)] text-[10px] font-semibold tracking-[-0.01em] text-white">
                    {step.number}
                  </span>
                </div>

                <h3 className="mb-2 text-lg font-semibold tracking-[-0.01em] text-[var(--apple-label)]">
                  {step.title}
                </h3>
                <p className="apple-body-tracking text-sm leading-relaxed text-[var(--apple-secondary-label)]">
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
