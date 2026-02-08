import Link from 'next/link';
import { ArrowRight, Plus, Sparkles, Star } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/slices/authSlice';

type QuickAction = {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  requires?: string[];
};

const actions: QuickAction[] = [
  {
    title: 'Πρόσθεσε στο backlog',
    description: 'Οργάνωσε έναν νέο τίτλο στη λίστα σου.',
    href: '/pages/backlog',
    icon: <Plus className="h-5 w-5" />,
  },
  {
    title: 'Κριτικές κοινότητας',
    description: 'Δες τι προτείνει η κοινότητα.',
    href: '/pages/reviews',
    icon: <Star className="h-5 w-5" />,
  },
  {
    title: 'Ανακάλυψε κάτι νέο',
    description: 'Βρες νέες ιδέες για το επόμενο hobby σου.',
    href: '/pages/news',
    icon: <Sparkles className="h-5 w-5" />,
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
      <div className="mx-auto max-w-7xl space-y-4">
        <h2 className="apple-label text-xl font-semibold tracking-[-0.02em]">Γρήγορες κινήσεις</h2>

        <div className="grid gap-4 md:grid-cols-3">
          {visibleActions.map(action => (
            <Link
              key={action.title}
              href={action.href}
              className="apple-card group flex items-start gap-4 p-5 transition duration-200 hover:brightness-[1.02]"
            >
              <div className="apple-secondary-label mt-0.5">{action.icon}</div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="apple-label text-sm font-semibold">{action.title}</h3>
                  <ArrowRight className="apple-secondary-label h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </div>
                <p className="apple-secondary-label apple-body-tracking text-sm leading-relaxed">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
