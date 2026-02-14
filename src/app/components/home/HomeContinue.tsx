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
    category: 'Games',
    title: 'Συνέχισε να παίζεις',
    progress: 'Κατάσταση: Playing',
    href: '/pages/backlog?category=games&status=current',
    icon: <Gamepad2 className="h-5 w-5" />,
    requires: ['games'],
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
          <Clock className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Άλλα που έχεις ανοιχτά</h2>
            <p className="text-xs text-muted-foreground">Μικρά reminders για να αποφασίσεις</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleContinueItems.map(item => (
            <Link
              key={item.category}
              href={item.href}
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{item.category}</p>
                <h3 className="truncate font-medium text-foreground">{item.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.progress}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
