import type { User } from '@/types/user';
import { getCategoryGroups, type ProfileCategoryKey } from './profileData';
import { HobbyCard } from './HobbyCard';

type HobbyGridProps = {
  categories: ProfileCategoryKey[];
  categoryProfile: User['category_profile'];
  genreAffinity?: Record<string, string[]>;
  showPsnId?: boolean;
};

export function HobbySection({
  categories,
  categoryProfile,
  genreAffinity,
  showPsnId = true,
}: Readonly<HobbyGridProps>) {
  const groups = getCategoryGroups(categories);
  if (groups.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="hobby-grid-heading"
      className="rounded-3xl border border-border/60 bg-card/50 p-5 sm:p-6"
    >
      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Identity Dashboard
        </p>
        <h2
          id="hobby-grid-heading"
          className="mt-1 text-2xl font-semibold tracking-tight text-foreground"
        >
          Hobby Identity
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your entertainment, creative, and lifestyle fingerprint.
        </p>
      </header>

      <div className="space-y-6">
        {groups.map(group => (
          <section
            key={group.group}
            aria-label={group.group}
            className="rounded-2xl border border-border/50 bg-card/40 p-4 sm:p-5"
          >
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-foreground/90">
              {group.group}
            </h3>
            <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 2xl:grid-cols-3">
              {group.categories.map(category => (
                <div key={category} className="min-w-[18.5rem] snap-start md:min-w-0">
                  <HobbyCard
                    category={category}
                    note={(categoryProfile?.[category] as Record<string, unknown>) || {}}
                    genreAffinity={genreAffinity}
                    showPsnId={showPsnId}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

export const HobbyGrid = HobbySection;
