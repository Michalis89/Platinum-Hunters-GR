import Link from 'next/link';
import { Gamepad2, Film, Book, Tv, ArrowRight, Clock, BookOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/slices/authSlice';

type ContinueItem = {
  category: string;
  title: string;
  progress?: string;
  href: string;
  icon: ReactNode;
  requires?: string[];
};

const continueItems: ContinueItem[] = [
  {
    category: 'Gaming',
    title: 'Συνέχισε να παίζεις',
    progress: 'Κατάσταση: Playing',
    href: '/pages/backlog?category=gaming&status=current',
    icon: <Gamepad2 className="h-5 w-5" />,
    requires: ['gaming'],
  },
  {
    category: 'Anime',
    title: 'Συνέχισε να παρακολουθείς',
    progress: 'Κατάσταση: Σε εξέλιξη',
    href: '/pages/backlog?category=anime&status=current',
    icon: <Tv className="h-5 w-5" />,
    requires: ['anime'],
  },
  {
    category: 'Manga',
    title: 'Συνέχισε να διαβάζεις',
    progress: 'Κατάσταση: Σε εξέλιξη',
    href: '/pages/backlog?category=manga&status=current',
    icon: <BookOpen className="h-5 w-5" />,
    requires: ['manga'],
  },
  {
    category: 'Ταινίες',
    title: 'Στη watchlist σου',
    progress: 'Κατάσταση: Προγραμματισμένο',
    href: '/pages/backlog?category=movies&status=planned',
    icon: <Film className="h-5 w-5" />,
    requires: ['movies'],
  },
  {
    category: 'Σειρές',
    title: 'Βλέπεις αυτή την περίοδο',
    progress: 'Κατάσταση: Σε εξέλιξη',
    href: '/pages/backlog?category=tv&status=current',
    icon: <Tv className="h-5 w-5" />,
    requires: ['tv'],
  },
  {
    category: 'Βιβλία',
    title: 'Διαβάζεις αυτή την περίοδο',
    progress: 'Κατάσταση: Σε εξέλιξη',
    href: '/pages/backlog?category=books&status=current',
    icon: <Book className="h-5 w-5" />,
    requires: ['books'],
  },
];

export function HomeContinue() {
  const user = useSelector(selectUser);
  const userCategories = (user?.categories as string[] | undefined) ?? [];

  const visibleContinueItems = continueItems.filter(item => {
    if (!item.requires) return true;
    return item.requires.some(cat => userCategories.includes(cat));
  });

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
          {visibleContinueItems.map(item => (
            <Link
              key={item.category}
              href={item.href}
              className="hover:border-[var(--hb-primary-strong)]/40 group flex items-center gap-4 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4 transition hover:-translate-y-0.5"
            >
              <div className="group-hover:bg-[var(--hb-primary-strong)]/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[var(--hb-muted)] transition group-hover:text-[var(--hb-primary-strong)]">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--hb-muted)]">{item.category}</p>
                <h3 className="truncate font-medium text-[var(--hb-headline)]">{item.title}</h3>
                <p className="mt-0.5 text-xs text-[var(--hb-muted)]">{item.progress}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--hb-muted)] opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
