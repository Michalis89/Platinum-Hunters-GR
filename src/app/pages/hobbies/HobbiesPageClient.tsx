'use client';

import { HobbiesHero, HobbiesCategorySection } from '@/app/components/hobbies';
import { HOBBY_SECTIONS } from '@/config/hobbies';
import { Footer } from '@/app/components/layout/Footer';

export default function HobbiesPageClient() {
  return (
    <div className="relative min-h-screen bg-[var(--hb-bg)] text-[var(--hb-text)]">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-70">
        <div className="absolute inset-0 bg-[var(--hb-gradient)] blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative">
        <HobbiesHero />

        {HOBBY_SECTIONS.map((section) => (
          <HobbiesCategorySection key={section.type} section={section} />
        ))}

        {/* Legend */}
        <section className="px-4 py-10 md:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--hb-muted)]">
                Σημειώσεις
              </h3>
              <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                  <div>
                    <p className="font-medium text-[var(--hb-headline)]">Backlog</p>
                    <p className="text-[var(--hb-muted)]">
                      Απαιτεί σύνδεση. Οργάνωσε τα hobbies σου με status και πρόοδο.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-400" />
                  <div>
                    <p className="font-medium text-[var(--hb-headline)]">Άρθρα</p>
                    <p className="text-[var(--hb-muted)]">
                      Διαθέσιμα για όλους. Διάβασε άρθρα και tutorials.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                  <div>
                    <p className="font-medium text-[var(--hb-headline)]">Κριτικές</p>
                    <p className="text-[var(--hb-muted)]">
                      Υπό κατασκευή. Σύντομα κριτικές από την κοινότητα.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
