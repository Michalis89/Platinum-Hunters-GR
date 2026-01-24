import { Layers } from 'lucide-react';

export function HobbiesHero() {
  return (
    <section className="relative px-4 pb-16 pt-12 md:px-6 md:pb-20 md:pt-16">
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[var(--hb-primary-strong)]">
          Ο κατάλογος των hobbies
        </p>

        <h1 className="mb-5 text-3xl font-extrabold leading-tight md:text-4xl lg:text-5xl">
          <span className="bg-gradient-to-r from-[var(--hb-headline)] via-[var(--hb-text)] to-[var(--hb-muted)] bg-clip-text text-transparent">
            Εξερεύνησε τα
          </span>{' '}
          <span className="bg-gradient-to-r from-[var(--hb-primary-strong)] via-[var(--hb-primary)] to-[var(--hb-accent)] bg-clip-text text-transparent">
            Hobbies
          </span>
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-[var(--hb-muted)] md:text-lg">
          Επέλεξε την κατηγορία που σε ενδιαφέρει και ξεκίνα να οργανώνεις: backlog,
          άρθρα, reviews — όλα σε ένα μέρος.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--hb-muted)]">
          <div className="flex items-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-4 py-2">
            <Layers className="h-4 w-4 text-[var(--hb-primary-strong)]" />
            <span>9 κατηγορίες</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Backlog</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            <span>Άρθρα</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>Reviews</span>
          </div>
        </div>
      </div>
    </section>
  );
}
