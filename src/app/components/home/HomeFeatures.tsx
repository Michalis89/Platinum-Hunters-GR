import { Layers, ListTodo, BarChart3, Trophy, StickyNote, Gamepad2 } from 'lucide-react';
import type { ReactNode } from 'react';

type Feature = {
  title: string;
  description: string;
  icon: ReactNode;
};

const features: Feature[] = [
  {
    title: 'Όλα τα hobbies, σε ένα σημείο',
    description:
      'Games, anime, manga, ταινίες, σειρές, βιβλία — ξεχωριστές λίστες με κοινή λογική και ίδιο “flow” καταγραφής.',
    icon: <Layers className="h-6 w-6" />,
  },

  {
    title: 'Progress Tracking',
    description: 'Ώρες, επεισόδια, κεφάλαια, σελίδες. Ενημέρωσε την πρόοδό σου με ένα click.',
    icon: <ListTodo className="h-6 w-6" />,
  },
  {
    title: 'Στατιστικά',
    description: 'Πόσο χρόνο αφιέρωσες, τι ολοκλήρωσες, ποια genres και platforms προτιμάς.',
    icon: <BarChart3 className="h-6 w-6" />,
  },
  {
    title: 'Trophy Guides',
    description: 'Αναλυτικοί οδηγοί για platinum trophies: difficulty, ώρες, missables, tips.',
    icon: <Trophy className="h-6 w-6" />,
  },
  {
    title: 'Σημειώσεις',
    description: 'Quick notes για κάθε entry. Θυμήσου πού σταμάτησες ή τι ήθελες να δοκιμάσεις.',
    icon: <StickyNote className="h-6 w-6" />,
  },
  {
    title: 'Gaming Focus',
    description: 'Ειδική υποστήριξη για gamers: platforms, trophy stats, completion rate.',
    icon: <Gamepad2 className="h-6 w-6" />,
  },
];

export function HomeFeatures() {
  return (
    <section className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center md:mb-14">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--hb-primary-strong)]">
            Δυνατότητες
          </p>
          <h2 className="mb-4 text-3xl font-bold text-[var(--hb-headline)] md:text-4xl">
            Ό,τι χρειάζεσαι για τα hobbies σου
          </h2>
          <p className="mx-auto max-w-xl text-[var(--hb-muted)]">
            Σχεδιασμένο για hobbyists που θέλουν οργάνωση χωρίς πολυπλοκότητα.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(feature => (
            <div
              key={feature.title}
              className="hover:border-[var(--hb-primary-strong)]/50 group rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-5 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-[var(--hb-shadow-md-hover)]"
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
