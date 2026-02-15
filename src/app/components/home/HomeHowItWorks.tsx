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
    title: 'Sign up',
    description: 'Create an account in seconds. No payment, no spam.',
    icon: <UserPlus className="h-6 w-6" />,
  },
  {
    number: '02',
    title: 'Add your first entry',
    description: 'Search for a game, movie, or book. Or import your Steam library.',
    icon: <Library className="h-6 w-6" />,
  },
  {
    number: '03',
    title: 'Update as you go',
    description: "Mark status, log hours or episodes, add notes. That's it.",
    icon: <TrendingUp className="h-6 w-6" />,
  },
];

export function HomeHowItWorks() {
  return (
    <section className="relative px-4 py-12 md:px-6 md:py-16">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-10 text-center md:mb-12">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-primary">Getting started</p>
          <h2 className="mb-4 text-3xl font-semibold text-foreground md:text-4xl">
            Sign up and start tracking
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-14 hidden h-px w-full -translate-x-1/2 bg-gradient-to-r from-border via-primary/20 to-border md:block" />
              )}

              <div className="relative flex flex-col items-center rounded-lg p-6 text-center">
                <div className="relative mb-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-card text-primary shadow-sm">
                    {step.icon}
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-semibold tracking-[-0.01em] text-white">
                    {step.number}
                  </span>
                </div>

                <h3 className="mb-2 text-lg font-semibold tracking-[-0.01em] text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
