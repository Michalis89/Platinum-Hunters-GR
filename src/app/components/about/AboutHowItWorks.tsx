import { Ban, Bell, TrendingUp, Users } from 'lucide-react';
import type { ReactNode } from 'react';

type Boundary = {
  title: string;
  description: string;
  icon: ReactNode;
};

const boundaries: Boundary[] = [
  {
    title: 'Not a social network',
    description:
      'No feeds, no follows, no public profiles by default. Your library is yours. Community features are optional and off by default.',
    icon: <Users className="h-6 w-6" />,
  },
  {
    title: 'Not a catalog race',
    description:
      'No leaderboards, no badges, no completion percentages shown to others. Track for yourself, not for comparison.',
    icon: <TrendingUp className="h-6 w-6" />,
  },
  {
    title: 'Not a notification engine',
    description:
      'No push notifications, no daily reminders, no "you haven\'t logged in" emails. You open it when you need it.',
    icon: <Bell className="h-6 w-6" />,
  },
  {
    title: 'Not an algorithm',
    description:
      'No personalized feeds, no "because you watched," no auto-play. Suggestions appear only when you search or import—never pushed.',
    icon: <Ban className="h-6 w-6" />,
  },
];

export function AboutHowItWorks() {
  return (
    <section className="relative px-4 py-20 md:px-6 md:py-28">
      <div className="via-primary/[0.02] pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-transparent" />

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-12 text-center md:mb-16">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-primary">Boundaries</p>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            What Hobbistas is not
          </h2>
          <p className="mx-auto max-w-xl text-muted-foreground">
            These are the things we deliberately avoid. Your space stays calm because these features
            don&apos;t exist.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {boundaries.map(boundary => (
            <div
              key={boundary.title}
              className="hover:border-primary/40 flex gap-4 rounded-xl border border-border bg-card p-5 transition"
            >
              <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-primary">
                {boundary.icon}
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-foreground">{boundary.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {boundary.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
