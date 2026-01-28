import Link from 'next/link';
import { Newspaper, Plus, ArrowRight, Star, Cog } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/slices/authSlice';

type QuickAction = {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  primary?: boolean;
  requires?: string[];
};

const actions: QuickAction[] = [
  {
    title: 'Το Προφίλ μου',
    description: 'Στατιστικά και πρόοδος',
    href: '/pages/profile',
    icon: <Cog className="h-5 w-5" />,
  },
  {
    title: 'Νέα & Άρθρα',
    description: 'Τελευταία νέα και updates',
    href: '/pages/news',
    icon: <Newspaper className="h-5 w-5" />,
  },
  {
    title: 'Reviews',
    description: 'Τελευταία reviews',
    href: '/pages/reviews',
    icon: <Star className="h-5 w-5" />,
  },
];

export function HomeQuickActions() {
  const user = useSelector(selectUser);
  const userCategories = (user?.categories as string[] | undefined) ?? [];

  const visibleActions = actions.filter(action => {
    if (!action.requires) return true;
    return action.requires.some(cat => userCategories.includes(cat));
  });

  return (
    <section className="px-4 py-8 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--hb-headline)]">Γρήγορη πρόσβαση</h2>
          <Link
            href="/pages/backlog"
            className="group flex items-center gap-1 text-sm text-[var(--hb-primary-strong)] transition hover:text-[var(--hb-accent)]"
          >
            <Plus className="h-4 w-4" />
            Πρόσθεσε στο backlog
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleActions.map(action => (
            <Link
              key={action.title}
              href={action.href}
              className={`group flex items-start gap-4 rounded-xl border p-4 transition hover:-translate-y-0.5 ${
                action.primary
                  ? 'border-[var(--hb-primary-strong)]/30 bg-[var(--hb-primary-strong)]/5 hover:border-[var(--hb-primary-strong)]/50'
                  : 'hover:border-[var(--hb-primary-strong)]/40 border-[var(--hb-border)] bg-[var(--hb-panel)]'
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition ${
                  action.primary
                    ? 'bg-[var(--hb-primary-strong)]/20 text-[var(--hb-primary-strong)]'
                    : 'bg-white/5 text-[var(--hb-muted)] group-hover:text-[var(--hb-primary-strong)]'
                }`}
              >
                {action.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[var(--hb-headline)]">{action.title}</h3>
                  <ArrowRight className="h-3 w-3 text-[var(--hb-muted)] opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
                </div>
                <p className="mt-0.5 text-sm text-[var(--hb-muted)]">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
