import { Heart, Zap, Shield } from 'lucide-react';
import type { ReactNode } from 'react';

type Principle = {
  title: string;
  description: string;
  icon: ReactNode;
};

const principles: Principle[] = [
  {
    title: 'Simplicity',
    description:
      'Clean interface and fast entry. The basics stay front and center extras remain hidden until you need them.',
    icon: <Zap className="h-5 w-5" />,
  },

  {
    title: 'Personal by default',
    description:
      'Starts with you: organization, progress, and history. If you want to share something later, you decide what to send.',
    icon: <Heart className="h-5 w-5" />,
  },
  {
    title: 'Privacy & Control',
    description:
      'We do not sell personal data. Hobbistas is built first for private use and clear control.',
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
              Our philosophy
            </p>
            <h2 className="mb-5 text-3xl font-bold text-[var(--hb-headline)] md:text-4xl">
              Why Hobbistas exists
            </h2>
            <p className="text-[var(--hb-text)]/90 mb-6 leading-relaxed">
              Hobbistas started from one simple need: keep my backlog from scattering across five
              different apps. I wanted a place to quickly note what I watched, read, or played and
              find it later without drama.
            </p>
            <p className="leading-relaxed text-[var(--hb-muted)]">
              It is built for clear organization and flow. Not &ldquo;one more feed&rdquo;, not
              endless menus. You sign in, record, and continue.
            </p>
          </div>

          <div className="space-y-4">
            {principles.map(principle => (
              <div
                key={principle.title}
                className="hover:border-[var(--hb-primary-strong)]/40 flex gap-4 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-5 transition"
              >
                <div className="bg-[var(--hb-primary-strong)]/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--hb-primary-strong)]">
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
