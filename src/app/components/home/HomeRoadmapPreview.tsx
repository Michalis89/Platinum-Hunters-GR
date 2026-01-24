import Link from 'next/link';
import { Smartphone, Users, Plug, ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

type RoadmapItem = {
  title: string;
  description: string;
  status: 'in-progress' | 'planned';
  icon: ReactNode;
};

const roadmapItems: RoadmapItem[] = [
  {
    title: 'Mobile App',
    description: 'Native εφαρμογή για iOS και Android με offline mode.',
    status: 'planned',
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    title: 'API Integrations',
    description: 'Sync με IGDB, TMDB, MyAnimeList για αυτόματα metadata.',
    status: 'in-progress',
    icon: <Plug className="h-5 w-5" />,
  },
  {
    title: 'Social Features',
    description: 'Προαιρετικό sharing, recommendations, friend lists.',
    status: 'planned',
    icon: <Users className="h-5 w-5" />,
  },
];

const statusColors = {
  'in-progress':
    'bg-[var(--hb-primary-strong)]/10 text-[var(--hb-primary-strong)] border-[var(--hb-primary-strong)]/30',
  planned:
    'bg-[var(--hb-muted)]/10 text-[var(--hb-muted)] border-[var(--hb-border)]',
};

const statusLabels = {
  'in-progress': 'Σε εξέλιξη',
  planned: 'Σύντομα',
};

export function HomeRoadmapPreview() {
  return (
    <section className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center md:mb-14">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--hb-primary-strong)]">
            Roadmap
          </p>
          <h2 className="mb-4 text-3xl font-bold text-[var(--hb-headline)] md:text-4xl">
            Τι ετοιμάζουμε
          </h2>
          <p className="mx-auto max-w-xl text-[var(--hb-muted)]">
            Συνεχίζουμε να βελτιώνουμε τον Χομπίστα με νέα features.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {roadmapItems.map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-5 transition hover:border-[var(--hb-primary-strong)]/40"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-[var(--hb-muted)] transition-colors group-hover:text-[var(--hb-primary-strong)]">
                  {item.icon}
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusColors[item.status]}`}
                >
                  {statusLabels[item.status]}
                </span>
              </div>
              <h3 className="mb-2 font-semibold text-[var(--hb-headline)]">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--hb-muted)]">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/pages/about"
            className="group inline-flex items-center gap-2 text-sm font-medium text-[var(--hb-primary-strong)] transition hover:text-[var(--hb-accent)]"
          >
            Δες το πλήρες roadmap
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
