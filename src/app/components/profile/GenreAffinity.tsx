import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CATEGORY_META, summarizeItems, type ProfileCategoryKey } from './profileData';

type GenreAffinityProps = {
  genreAffinity?: Record<string, string[]>;
};

export function GenreAffinity({ genreAffinity }: Readonly<GenreAffinityProps>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const supportedCategories: ProfileCategoryKey[] = [
    'games',
    'tv',
    'anime',
    'movies',
    'books',
    'manga',
  ];
  const categories = supportedCategories.filter(
    category => (genreAffinity?.[category] || []).length > 0,
  );

  const weakMetadataGenres = new Set([
    'adult cast',
    'award winning',
    'children',
    'josei',
    'kids',
    'school',
    'seinen',
    'shoujo',
    'shounen',
    'workplace',
  ]);

  const isWeakGenre = (genre: string) => weakMetadataGenres.has(genre.toLowerCase());

  const handleRefreshAffinity = async () => {
    if (isRefreshing) {
      return;
    }
    setRefreshError(null);
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/me/genre-affinity', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to rebuild taste profile');
      }
      window.location.reload();
    } catch {
      setRefreshError('Could not rebuild taste profile. Please try again.');
      setIsRefreshing(false);
    }
  };

  return (
    <section
      aria-labelledby="genre-affinity-heading"
      className="rounded-3xl border border-border/60 bg-card/50 p-5 sm:p-6"
    >
      <header className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Taste Profile
            </p>
            <h2
              id="genre-affinity-heading"
              className="mt-1 text-xl font-semibold tracking-tight text-foreground"
            >
              Genre Affinity
            </h2>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleRefreshAffinity()}
            disabled={isRefreshing}
            className="h-8 rounded-lg border-border/60 bg-card/60 px-3 text-xs text-muted-foreground"
          >
            {isRefreshing ? 'Rebuilding...' : 'Rebuild Taste'}
          </Button>
        </div>
        {refreshError ? <p className="mt-2 text-xs text-destructive">{refreshError}</p> : null}
      </header>

      {categories.length > 0 ? (
        <ul className="space-y-3">
          {categories.map(category => {
            const genres = genreAffinity?.[category] || [];
            const shouldSplit = category === 'anime' || category === 'manga';
            const nonWeak = genres.filter(genre => !isWeakGenre(genre));
            const weak = genres.filter(genre => isWeakGenre(genre));
            const topSource = shouldSplit ? (nonWeak.length > 0 ? nonWeak : genres) : genres;
            const supportingSource = shouldSplit ? weak : [];
            const { visible: visibleTop, extra: extraTop } = summarizeItems(topSource, 3);
            const { visible: visibleSupporting, extra: extraSupporting } = summarizeItems(
              supportingSource,
              3,
            );
            return (
              <li
                key={category}
                className="rounded-xl border border-border/50 bg-card/65 p-3 transition-colors hover:border-primary/30"
              >
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  {CATEGORY_META[category]?.title || category}
                </p>
                <div className="mt-2 space-y-2">
                  <div className="space-y-1.5">
                    {shouldSplit ? (
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
                        Top Genres
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-1.5">
                      {visibleTop.map(genre => (
                        <span
                          key={`${category}-top-${genre}`}
                          className="rounded-full border border-border/60 bg-card/70 px-2.5 py-1 text-[11px] text-muted-foreground"
                        >
                          {genre}
                        </span>
                      ))}
                      {extraTop > 0 ? (
                        <span className="rounded-full border border-border/60 bg-card/70 px-2.5 py-1 text-[11px] text-muted-foreground">
                          +{extraTop} more
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {shouldSplit && visibleSupporting.length > 0 ? (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
                        Supporting Genres
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {visibleSupporting.map(genre => (
                          <span
                            key={`${category}-support-${genre}`}
                            className="rounded-full border border-border/50 bg-card/50 px-2.5 py-1 text-[11px] text-muted-foreground/90"
                          >
                            {genre}
                          </span>
                        ))}
                        {extraSupporting > 0 ? (
                          <span className="rounded-full border border-border/50 bg-card/50 px-2.5 py-1 text-[11px] text-muted-foreground/90">
                            +{extraSupporting} more
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No affinity data yet. Keep using your library to build it.
        </p>
      )}
    </section>
  );
}
