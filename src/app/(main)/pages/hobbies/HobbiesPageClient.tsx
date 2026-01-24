'use client';

import { HobbiesHero, HobbiesCategorySection } from '@/app/components/hobbies';
import { HOBBY_SECTIONS } from '@/config/hobbies';
import { PageContainer } from '@/app/components/layout';

export default function HobbiesPageClient() {
  return (
    <>
      <HobbiesHero />

      {HOBBY_SECTIONS.map(section => (
        <HobbiesCategorySection key={section.type} section={section} />
      ))}

      {/* Legend */}
      <PageContainer size="lg" className="py-10">
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
      </PageContainer>
    </>
  );
}
