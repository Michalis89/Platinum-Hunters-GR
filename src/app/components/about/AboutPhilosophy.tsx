import { Heart, Zap, Shield } from 'lucide-react';
import type { ReactNode } from 'react';

type Principle = {
  title: string;
  description: string;
  icon: ReactNode;
};

const principles: Principle[] = [
  {
    title: 'Απλότητα',
    description:
      'Χωρίς clutter, χωρίς αχρείαστα features. Ένα καθαρό interface που σε αφήνει να επικεντρωθείς στα hobbies σου.',
    icon: <Zap className="h-5 w-5" />,
  },
  {
    title: 'Προσωπικό',
    description:
      'Δεν είναι social network. Είναι ο δικός σου χώρος, για τη δική σου οργάνωση και πρόοδο.',
    icon: <Heart className="h-5 w-5" />,
  },
  {
    title: 'Privacy-first',
    description:
      'Τα δεδομένα σου είναι δικά σου. Χωρίς tracking, χωρίς ads, χωρίς πώληση πληροφοριών.',
    icon: <Shield className="h-5 w-5" />,
  },
];

export function AboutPhilosophy() {
  return (
    <section className="px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--hb-primary-strong)]">
              Η φιλοσοφία μας
            </p>
            <h2 className="mb-5 text-3xl font-bold text-[var(--hb-headline)] md:text-4xl">
              Γιατί υπάρχει ο Χομπίστας
            </h2>
            <p className="mb-6 leading-relaxed text-[var(--hb-text)]/90">
              Θέλαμε ένα εργαλείο που δεν υπήρχε: ένα ενιαίο library για όλα τα
              hobbies, χωρίς την πολυπλοκότητα των μεγάλων platforms. Κάτι
              γρήγορο, καθαρό, personal.
            </p>
            <p className="leading-relaxed text-[var(--hb-muted)]">
              Ο Χομπίστας γεννήθηκε από gamers και cinephiles που ήθελαν να
              οργανώσουν τα backlogs τους χωρίς να χάνονται σε περιττές
              λειτουργίες. Το αποτέλεσμα είναι μια πλατφόρμα που κάνει ακριβώς
              αυτό που χρειάζεται — και τίποτα παραπάνω.
            </p>
          </div>

          <div className="space-y-4">
            {principles.map((principle) => (
              <div
                key={principle.title}
                className="flex gap-4 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-5 transition hover:border-[var(--hb-primary-strong)]/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--hb-primary-strong)]/10 text-[var(--hb-primary-strong)]">
                  {principle.icon}
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-[var(--hb-headline)]">
                    {principle.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--hb-muted)]">
                    {principle.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
