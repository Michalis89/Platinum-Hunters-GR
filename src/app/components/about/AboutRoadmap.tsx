import { Rocket, Smartphone, Users, Globe, Plug, Palette } from 'lucide-react';
import type { ReactNode } from 'react';

type RoadmapItem = {
  title: string;
  description: string;
  status: 'done' | 'in-progress' | 'planned';
  icon: ReactNode;
};

const roadmapItems: RoadmapItem[] = [
  {
    title: 'Mobile App',
    description:
      'Native εφαρμογή για iOS και Android. Quick add, notifications, offline mode.',
    status: 'planned',
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    title: 'Social Features',
    description:
      'Προαιρετικό sharing. Δες τι παίζουν οι φίλοι σου, recommendations, lists.',
    status: 'planned',
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: 'API Integrations',
    description:
      'Sync με IGDB, TMDB, MyAnimeList. Αυτόματη ενημέρωση metadata και covers.',
    status: 'in-progress',
    icon: <Plug className="h-5 w-5" />,
  },
  {
    title: 'Multilingual',
    description:
      'Πλήρης υποστήριξη για αγγλικά, με δυνατότητα επιλογής γλώσσας.',
    status: 'planned',
    icon: <Globe className="h-5 w-5" />,
  },
  {
    title: 'Custom Themes',
    description:
      'Επέλεξε χρώματα, dark/light mode, custom accents για το profile σου.',
    status: 'planned',
    icon: <Palette className="h-5 w-5" />,
  },
  {
    title: 'Public Profiles',
    description:
      'Προαιρετική δημοσιοποίηση του backlog σου. Share achievements και stats.',
    status: 'planned',
    icon: <Rocket className="h-5 w-5" />,
  },
];

const statusColors = {
  done: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'in-progress':
    'bg-[var(--hb-primary-strong)]/10 text-[var(--hb-primary-strong)] border-[var(--hb-primary-strong)]/30',
  planned: 'bg-[var(--hb-muted)]/10 text-[var(--hb-muted)] border-[var(--hb-border)]',
};

const statusLabels = {
  done: 'Ολοκληρώθηκε',
  'in-progress': 'Σε εξέλιξη',
  planned: 'Προγραμματισμένο',
};

export function AboutRoadmap() {
  return (
    <section className="px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center md:mb-16">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--hb-primary-strong)]">
            Roadmap
          </p>
          <h2 className="mb-4 text-3xl font-bold text-[var(--hb-headline)] md:text-4xl">
            Τι έρχεται
          </h2>
          <p className="mx-auto max-w-xl text-[var(--hb-muted)]">
            Συνεχίζουμε να βελτιώνουμε τον Χομπίστα. Εδώ είναι μερικά από τα
            features που σχεδιάζουμε.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${statusColors[item.status]}`}
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

        <p className="mt-6 text-center text-xs text-[var(--hb-muted)]">
          * Το roadmap μπορεί να αλλάξει με βάση το feedback της κοινότητας
        </p>
      </div>
    </section>
  );
}
