import { CATEGORY_META, summarizeItems, type ProfileCategoryKey } from './profileData';

type GenreAffinityProps = {
  genreAffinity?: Record<string, string[]>;
};

export function GenreAffinity({ genreAffinity }: Readonly<GenreAffinityProps>) {
  const supportedCategories: ProfileCategoryKey[] = ['games', 'tv', 'anime', 'movies', 'books', 'manga'];
  const categories = supportedCategories.filter(category => (genreAffinity?.[category] || []).length > 0);

  return (
    <section
      aria-labelledby="genre-affinity-heading"
      className="rounded-3xl border border-border/60 bg-card/50 p-5 sm:p-6"
    >
      <header className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Taste Profile</p>
        <h2 id="genre-affinity-heading" className="mt-1 text-xl font-semibold tracking-tight text-foreground">
          Genre Affinity
        </h2>
      </header>

      {categories.length > 0 ? (
        <ul className="space-y-3">
          {categories.map(category => {
            const genres = genreAffinity?.[category] || [];
            const { visible, extra } = summarizeItems(genres, 3);
            return (
              <li
                key={category}
                className="rounded-xl border border-border/50 bg-card/65 p-3 transition-colors hover:border-primary/30"
              >
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  {CATEGORY_META[category]?.title || category}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {visible.map(genre => (
                    <span
                      key={genre}
                      className="rounded-full border border-border/60 bg-card/70 px-2.5 py-1 text-[11px] text-muted-foreground"
                    >
                      {genre}
                    </span>
                  ))}
                  {extra > 0 && (
                    <span className="rounded-full border border-border/60 bg-card/70 px-2.5 py-1 text-[11px] text-muted-foreground">
                      +{extra} more
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No affinity data yet. Keep using your library to build it.</p>
      )}
    </section>
  );
}
