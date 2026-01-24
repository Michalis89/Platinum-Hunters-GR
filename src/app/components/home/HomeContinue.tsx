import Link from 'next/link';
import {
  Gamepad2,
  Film,
  Book,
  Tv,
  ArrowRight,
  Clock,
} from 'lucide-react';
import type { ReactNode } from 'react';

type ContinueItem = {
  category: string;
  title: string;
  progress?: string;
  href: string;
  icon: ReactNode;
};

const continueItems: ContinueItem[] = [
  {
    category: 'Games',
    title: 'Συνέχισε να παίζεις',
    progress: 'Backlog: Playing',
    href: '/pages/backlog?status=playing',
    icon: <Gamepad2 className="h-5 w-5" />,
  },
  {
    category: 'Anime',
    title: 'Συνέχισε να παρακολουθείς',
    progress: 'Status: Current',
    href: '/pages/backlog?category=anime&status=current',
    icon: <Tv className="h-5 w-5" />,
  },
  {
    category: 'Ταινίες',
    title: 'Watchlist',
    progress: 'Status: Planned',
    href: '/pages/backlog?category=movies&status=planned',
    icon: <Film className="h-5 w-5" />,
  },
  {
    category: 'Βιβλία',
    title: 'Διαβάζεις τώρα',
    progress: 'Status: Current',
    href: '/pages/backlog?category=books&status=current',
    icon: <Book className="h-5 w-5" />,
  },
];

export function HomeContinue() {
  return (
    <section className="px-4 py-8 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-center gap-2">
          <Clock className="h-5 w-5 text-[var(--hb-primary-strong)]" />
          <h2 className="text-lg font-semibold text-[var(--hb-headline)]">
            Συνέχισε από εκεί που σταμάτησες
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {continueItems.map((item) => (
            <Link
              key={item.category}
              href={item.href}
              className="group flex items-center gap-4 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--hb-primary-strong)]/40"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[var(--hb-muted)] transition group-hover:bg-[var(--hb-primary-strong)]/10 group-hover:text-[var(--hb-primary-strong)]">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--hb-muted)]">{item.category}</p>
                <h3 className="truncate font-medium text-[var(--hb-headline)]">
                  {item.title}
                </h3>
                <p className="mt-0.5 text-xs text-[var(--hb-muted)]">
                  {item.progress}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--hb-muted)] opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
