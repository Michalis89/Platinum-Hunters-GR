import {
  Layers,
  ListTodo,
  BarChart3,
  Star,
  StickyNote,
  Trophy,
  Gamepad2,
  Film,
} from 'lucide-react';
import type { ReactNode } from 'react';

type Feature = {
  title: string;
  description: string;
  icon: ReactNode;
};

const features: Feature[] = [
  {
    title: 'Multi-hobby Backlog',
    description:
      'Games, anime, manga, ταινίες, σειρές, βιβλία μία λίστα για όλα. Κοινή δομή, διαφορετικά metadata ανά κατηγορία.',
    icon: <Layers className="h-6 w-6" />,
  },
  {
    title: 'Progress Tracking',
    description:
      'Παρακολούθησε την πρόοδό σου: ώρες, επεισόδια, τόμους, σελίδες. Quick update με ένα click.',
    icon: <ListTodo className="h-6 w-6" />,
  },
  {
    title: 'Στατιστικά προόδου',
    description:
      'Συγκεντρωτικά stats για να βλέπεις τι ολοκληρώνεις και πόσο χρόνο επενδύεις, ανά κατηγορία.',
    icon: <BarChart3 className="h-6 w-6" />,
  },

  {
    title: 'Reviews & Βαθμολογίες',
    description:
      'Κράτα τις εντυπώσεις σου. Βαθμολόγησε, γράψε σύντομο review, θυμήσου γιατί σου άρεσε.',
    icon: <Star className="h-6 w-6" />,
  },
  {
    title: 'Σημειώσεις & Notes',
    description:
      'Quick notes, tips, reminders για κάθε entry. Ποτέ μην ξεχάσεις πού σταμάτησες ή τι ήθελες να δοκιμάσεις.',
    icon: <StickyNote className="h-6 w-6" />,
  },
  {
    title: 'Trophy Tips',
    description:
      'Συμβουλές για platinum trophies και achievements. Difficulty, εκτιμώμενες ώρες, missables, tips.',
    icon: <Trophy className="h-6 w-6" />,
  },
  {
    title: 'Gaming Focus',
    description:
      'Ειδική υποστήριξη για gamers: platforms, trophy stats, completion rate, backlog prioritization.',
    icon: <Gamepad2 className="h-6 w-6" />,
  },
  {
    title: 'Πολυμέσα',
    description:
      'Ταινίες, σειρές, ντοκιμαντέρ. Tracking για binge-watching, watchlist, και rewatch notes.',
    icon: <Film className="h-6 w-6" />,
  },
];

export function AboutFeatures() {
  return (
    <section className="px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center md:mb-16">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--hb-primary-strong)]">
            Δυνατότητες
          </p>
          <h2 className="mb-4 text-3xl font-bold text-[var(--hb-headline)] md:text-4xl">
            Όλα όσα χρειάζεσαι, τίποτα παραπάνω
          </h2>
          <p className="mx-auto max-w-2xl text-[var(--hb-muted)]">
            Σχεδιασμένο για hobbyists που θέλουν να οργανώνουν χωρίς περιττή πολυπλοκότητα.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(feature => (
            <div
              key={feature.title}
              className="hover:border-[var(--hb-primary-strong)]/50 group relative rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--hb-shadow-md-hover)]"
            >
              <div className="bg-[var(--hb-primary-strong)]/10 group-hover:bg-[var(--hb-primary-strong)]/20 mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-[var(--hb-primary-strong)] transition-colors">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-base font-semibold text-[var(--hb-headline)]">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--hb-muted)]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
