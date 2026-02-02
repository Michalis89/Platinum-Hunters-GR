'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { HobbiesHero, HobbiesCategorySection } from '@/app/components/hobbies';
import { HOBBY_SECTIONS } from '@/config/hobbies';
import { PageContainer } from '@/app/components/layout';
import { selectUser, selectIsAuthenticated, selectIsLoading } from '@/store/slices/authSlice';
import { hasAnyRole } from '@/lib/roles';

export default function HobbiesPageClient() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAuthLoading = useSelector(selectIsLoading);
  const user = useSelector(selectUser);

  // Prevent hydration mismatch by tracking client mount
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const hasAllAccess = hasAnyRole(user, ['admin', 'owner', 'moderator']);

  // Filter sections based on user's selected categories (if logged in)
  // Only apply filtering after client mount to prevent hydration mismatch
  const userCategories = (user?.categories as string[] | undefined) ?? [];
  const filteredSections =
    !hasMounted || isAuthLoading
      ? HOBBY_SECTIONS // During SSR/hydration, show all sections
      : hasAllAccess
        ? HOBBY_SECTIONS
        : isAuthenticated && userCategories.length > 0
          ? HOBBY_SECTIONS.filter(section =>
              section.categories.some(category => userCategories.includes(category)),
            )
          : HOBBY_SECTIONS;

  return (
    <>
      <HobbiesHero />

      {filteredSections.length > 0 ? (
        filteredSections.map(section => (
          <HobbiesCategorySection key={section.type} section={section} />
        ))
      ) : (
        <PageContainer size="lg" className="py-10">
          <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-8 text-center">
            <div className="mb-4 text-5xl">🎯</div>
            <h2 className="mb-2 text-xl font-bold text-[var(--hb-headline)]">
              Δεν έχεις επιλέξει κατηγορίες
            </h2>
            <p className="mb-6 text-[var(--hb-muted)]">
              Πήγαινε στις ρυθμίσεις προφίλ για να επιλέξεις τα χόμπι που σε ενδιαφέρουν.
            </p>
            <a
              href="/pages/profile/edit"
              className="inline-block rounded-full bg-[var(--hb-primary-strong)] px-6 py-2 font-medium text-white transition hover:bg-[var(--hb-primary)]"
            >
              Ρυθμίσεις Προφίλ
            </a>
          </div>
        </PageContainer>
      )}

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
                  Διαθέσιμες για επιλεγμένες κατηγορίες. Δες τις κριτικές της κοινότητας.
                </p>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
