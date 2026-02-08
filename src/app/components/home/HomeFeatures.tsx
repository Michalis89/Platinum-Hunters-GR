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
    <section className="px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center md:mb-12">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--apple-system-blue)]">
            Δυνατότητες
          </p>
          <h2 className="apple-title-tracking mb-4 text-3xl font-semibold text-[var(--apple-label)] md:text-4xl">
            Ό,τι χρειάζεσαι για τα hobbies σου
          </h2>
          <p className="apple-body-tracking mx-auto max-w-xl text-[var(--apple-secondary-label)]">
            Σχεδιασμένο για hobbyists που θέλουν οργάνωση χωρίς πολυπλοκότητα.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(feature => (
            <div
              key={feature.title}
              className="apple-card group rounded-[var(--apple-radius-card)] p-6 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--apple-system-blue)_34%,transparent)] hover:shadow-[var(--hb-shadow-md-hover)]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)] text-[var(--apple-system-blue)] transition-colors group-hover:bg-[color-mix(in_srgb,var(--apple-system-blue)_12%,transparent)]">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-base font-semibold tracking-[-0.01em] text-[var(--apple-label)]">
                {feature.title}
              </h3>
              <p className="apple-body-tracking text-sm leading-relaxed text-[var(--apple-secondary-label)]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
