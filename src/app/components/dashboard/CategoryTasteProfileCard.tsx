'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  buildTasteProfile,
  type CategoryTasteProfileItem,
  type DashboardCategoryKey,
  type InsightTagBucket,
} from '@/lib/dashboard/category-data';
import DashboardSectionHeader from './DashboardSectionHeader';
import {
  DASH_BORDER,
  DASH_RADIUS_CARD,
  DASH_RADIUS_SECTION,
  DASH_SURFACE_CARD,
  DASH_SURFACE_SECTION,
} from './dashboard-ui-tokens';
import type { MediaEntry } from '@/app/components/backlog/types';

const CATEGORY_LABELS: Record<DashboardCategoryKey, string> = {
  games: 'Games',
  anime: 'Anime',
  manga: 'Manga',
  movies: 'Movies',
  tv: 'TV',
  books: 'Books',
};

const BUCKET_LABELS: Record<InsightTagBucket | 'genre', string> = {
  subgenre: 'Genres',
  mechanic: 'Game Modes',
  mood: 'Mood',
  theme: 'Themes',
  structure: 'Player Perspectives',
  genre: 'Genre',
};
const GAME_VISIBLE_BUCKETS: InsightTagBucket[] = ['subgenre', 'mechanic', 'theme', 'structure'];

const MIN_VISIBLE_PERCENTAGE = 0;
const MAX_TRAITS_PER_BUCKET = 5;

type TasteProfileBarTrait = {
  name: string;
  percentageValue: number;
  percentageLabel: string;
  count: number;
};

type ExtraTraitSection = {
  label: string;
  traits: TasteProfileBarTrait[];
};

type TasteProfileBarBucket = {
  bucketKey: InsightTagBucket | 'genre';
  traits: TasteProfileBarTrait[];
};

type CategoryTasteProfileCardProps = {
  category: DashboardCategoryKey;
  items: CategoryTasteProfileItem[];
};

export default function CategoryTasteProfileCard({
  category,
  items,
}: CategoryTasteProfileCardProps) {
  const tasteProfile = buildTasteProfile(items, category);
  const [extraSections, setExtraSections] = useState<ExtraTraitSection[]>([]);
  const [isLoadingExtraSections, setIsLoadingExtraSections] = useState(category !== 'games');
  const categoryLabel = CATEGORY_LABELS[category] ?? 'Category';
  const profileBuckets: TasteProfileBarBucket[] =
    category === 'games'
      ? GAME_VISIBLE_BUCKETS.map(bucket => ({
          bucketKey: bucket,
          traits: (tasteProfile.topBuckets[bucket] ?? []).map(trait => ({
            name: trait.name,
            count: trait.count,
            percentageValue: Math.max(0, Math.min(100, trait.percent)),
            percentageLabel: `${Math.round(trait.percent)}%`,
          })),
        }))
      : [
          {
            bucketKey: 'genre',
            traits: tasteProfile.topGenres.map(trait => ({
              name: trait.name,
              count: trait.count,
              percentageValue: Math.max(0, Math.min(100, trait.percent)),
              percentageLabel: `${Math.round(trait.percent)}%`,
            })),
          },
        ];

  const visibleBuckets = profileBuckets
    .map(bucket => ({
      ...bucket,
      traits: [...bucket.traits]
        .filter(trait => trait.percentageValue >= MIN_VISIBLE_PERCENTAGE)
        .sort((a, b) => {
          if (b.percentageValue !== a.percentageValue) {
            return b.percentageValue - a.percentageValue;
          }
          return a.name.localeCompare(b.name);
        })
        .slice(0, MAX_TRAITS_PER_BUCKET),
    }))
    .filter(bucket => (category === 'games' ? true : bucket.traits.length > 0));

  useEffect(() => {
    let cancelled = false;

    const parseScore = (score?: string | null) => {
      if (!score) {
        return null;
      }
      const value = Number.parseFloat(score);
      return Number.isFinite(value) ? value : null;
    };

    const scoreWeight = (score: number | null) => {
      if (score === null) {
        return 0;
      }
      if (score >= 10) {
        return 5;
      }
      if (score >= 9) {
        return 4;
      }
      if (score >= 8) {
        return 3;
      }
      if (score >= 7) {
        return 2;
      }
      return 0;
    };

    const buildEntryWeight = (entry: MediaEntry, withRuntimeBonus = false) => {
      if (entry.status !== 'completed') {
        return 0;
      }
      let points = 1;
      if (entry.isFavorite) {
        points += 6;
      }
      points += scoreWeight(parseScore(entry.score));
      if (withRuntimeBonus && typeof entry.totalRuntime === 'number' && entry.totalRuntime > 180) {
        points += 0.5;
      }
      return points;
    };

    const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ');
    const addWeightedNames = (target: Map<string, number>, names: string[], points: number) => {
      for (const rawName of names) {
        const name = normalizeName(rawName);
        if (!name) {
          continue;
        }
        target.set(name, (target.get(name) ?? 0) + points);
      }
    };

    const buildSectionFromMap = (label: string, source: Map<string, number>) => {
      const totalWeight = Array.from(source.values()).reduce((sum, value) => sum + value, 0);
      if (totalWeight <= 0) {
        return null;
      }

      const traits: TasteProfileBarTrait[] = Array.from(source.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_TRAITS_PER_BUCKET)
        .map(([name, weightSum]) => {
          const percent = (weightSum / totalWeight) * 100;
          return {
            name,
            count: Math.max(1, Math.round(weightSum)),
            percentageValue: Math.max(0, Math.min(100, percent)),
            percentageLabel: `${Math.round(percent)}%`,
          };
        });

      if (traits.length === 0) {
        return null;
      }

      return { label, traits } satisfies ExtraTraitSection;
    };

    const fetchLibraryEntries = async () => {
      const endpoint =
        category === 'movies' || category === 'tv'
          ? '/api/movies/library'
          : category === 'books'
            ? '/api/books/library'
            : '/api/anime/library';
      const response = await fetch(`${endpoint}?category=${category}`);
      if (!response.ok) {
        return [] as MediaEntry[];
      }
      const payload = (await response.json()) as { items?: MediaEntry[] };
      return Array.isArray(payload.items) ? payload.items : [];
    };

    const fetchTmdbCredits = async (entry: MediaEntry) => {
      const tmdbId = entry.externalId;
      if (typeof tmdbId !== 'number') {
        return null;
      }
      const response = await fetch(`/api/movies/credits?category=${category}&tmdb_id=${tmdbId}`);
      if (!response.ok) {
        return null;
      }
      return (await response.json()) as { directors?: string[]; actors?: string[] };
    };

    const load = async () => {
      if (category === 'games') {
        if (!cancelled) {
          setExtraSections([]);
          setIsLoadingExtraSections(false);
        }
        return;
      }

      if (!cancelled) {
        setIsLoadingExtraSections(true);
      }
      const entries = await fetchLibraryEntries();
      const sections: ExtraTraitSection[] = [];

      const formatMap = new Map<string, number>();
      for (const entry of entries) {
        const points = buildEntryWeight(entry);
        if (points <= 0 || !entry.format) {
          continue;
        }
        addWeightedNames(formatMap, [entry.format], points);
      }
      const formatSection = buildSectionFromMap(
        category === 'movies'
          ? 'Watching Style'
          : category === 'tv'
            ? 'Series Style'
            : category === 'anime'
              ? 'Watching Format'
              : 'Reading Format',
        formatMap,
      );
      if (formatSection) {
        sections.push(formatSection);
      }

      if (category === 'movies' || category === 'tv') {
        const directorsMap = new Map<string, number>();
        const actorsMap = new Map<string, number>();
        const completedEntries = entries.filter(entry => entry.status === 'completed');
        const creditsList = await Promise.all(
          completedEntries.map(async entry => ({ entry, credits: await fetchTmdbCredits(entry) })),
        );
        for (const { entry, credits } of creditsList) {
          if (!credits) {
            continue;
          }
          const points = buildEntryWeight(entry, true);
          if (points <= 0) {
            continue;
          }
          addWeightedNames(directorsMap, credits.directors ?? [], points);
          addWeightedNames(actorsMap, credits.actors ?? [], points);
        }

        const directorsSection = buildSectionFromMap('Favorite Directors', directorsMap);
        if (directorsSection) {
          sections.push(directorsSection);
        }
        const actorsSection = buildSectionFromMap('Favorite Actors', actorsMap);
        if (actorsSection) {
          sections.push(actorsSection);
        }
      }

      if (category === 'books' || category === 'manga') {
        const authorsMap = new Map<string, number>();
        for (const entry of entries) {
          const points = buildEntryWeight(entry);
          if (points <= 0 || !entry.authors || entry.authors.length === 0) {
            continue;
          }
          addWeightedNames(authorsMap, entry.authors, points);
        }
        const authorsSection = buildSectionFromMap('Favorite Authors', authorsMap);
        if (authorsSection) {
          sections.push(authorsSection);
        }
      }

      if (category === 'anime') {
        const studiosMap = new Map<string, number>();
        for (const entry of entries) {
          const points = buildEntryWeight(entry);
          if (points <= 0 || !entry.studios || entry.studios.length === 0) {
            continue;
          }
          addWeightedNames(studiosMap, entry.studios, points);
        }
        const studiosSection = buildSectionFromMap('Favorite Studios', studiosMap);
        if (studiosSection) {
          sections.push(studiosSection);
        }
      }

      if (!cancelled) {
        setExtraSections(sections);
        setIsLoadingExtraSections(false);
      }
    };

    void load().catch(() => {
      if (!cancelled) {
        setExtraSections([]);
        setIsLoadingExtraSections(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [category]);

  const visibleExtraSections = useMemo(
    () =>
      extraSections
        .map(section => ({
          ...section,
          traits: [...section.traits]
            .filter(trait => trait.percentageValue >= MIN_VISIBLE_PERCENTAGE)
            .sort((a, b) => {
              if (b.percentageValue !== a.percentageValue) {
                return b.percentageValue - a.percentageValue;
              }
              return a.name.localeCompare(b.name);
            })
            .slice(0, MAX_TRAITS_PER_BUCKET),
        }))
        .filter(section => section.traits.length > 0),
    [extraSections],
  );
  const expectedExtraSectionCount =
    category === 'movies' || category === 'tv' ? 3 : category === 'anime' ? 2 : 2;
  const renderedExtraSectionCount = isLoadingExtraSections
    ? expectedExtraSectionCount
    : visibleExtraSections.length;
  const nonGamesCardCount = visibleBuckets.length + renderedExtraSectionCount;
  const nonGamesGridClass =
    nonGamesCardCount <= 1
      ? 'grid-cols-1'
      : nonGamesCardCount === 2
        ? 'md:grid-cols-2'
        : nonGamesCardCount === 3
          ? 'md:grid-cols-2 xl:grid-cols-3'
          : 'md:grid-cols-2 xl:grid-cols-4';

  return (
    <Card
      className={`col-span-full w-full min-w-0 ${DASH_RADIUS_SECTION} ${DASH_BORDER} bg-muted/[0.055] shadow-none`}
    >
      <CardHeader className="pb-3">
        <DashboardSectionHeader
          eyebrow={`${categoryLabel} Taste Profile`}
          title={`Based on ${tasteProfile.totalItems} completed + in-progress ${
            category === 'games' ? 'games' : 'items'
          }`}
        />
      </CardHeader>
      <CardContent className="space-y-5 overflow-hidden pt-2">
        {visibleBuckets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : category === 'games' ? (
          <div
            className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
          >
            {visibleBuckets.map(bucket => (
              <section
                key={bucket.bucketKey}
                className={`min-w-0 space-y-3 ${DASH_RADIUS_CARD} ${DASH_BORDER} ${DASH_SURFACE_CARD} p-3.5 shadow-none`}
              >
                <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground/85">
                  {BUCKET_LABELS[bucket.bucketKey]}
                </h4>
                <div className="space-y-3">
                  {bucket.traits.length === 0 ? (
                    <p className="text-xs text-muted-foreground/80">No data yet.</p>
                  ) : (
                    bucket.traits.map(trait => (
                      <div key={`${bucket.bucketKey}-${trait.name}`} className="min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-sm leading-tight">
                          <span className="min-w-0 break-words text-foreground">{trait.name}</span>
                          <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground/80">
                            {trait.percentageLabel}
                          </span>
                        </div>
                        <Progress value={trait.percentageValue} className="h-1.5 bg-muted" />
                      </div>
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className={`grid gap-5 ${nonGamesGridClass}`}>
            {visibleBuckets.map(bucket => (
              <section
                key={bucket.bucketKey}
                className={`min-w-0 space-y-3 ${DASH_RADIUS_CARD} ${DASH_BORDER} ${DASH_SURFACE_CARD} p-3.5 shadow-none`}
              >
                <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground/85">
                  {BUCKET_LABELS[bucket.bucketKey]}
                </h4>
                <div className="space-y-3">
                  {bucket.traits.map(trait => (
                    <div key={`${bucket.bucketKey}-${trait.name}`} className="min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm leading-tight">
                        <span className="min-w-0 break-words text-foreground">{trait.name}</span>
                        <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground/80">
                          {trait.percentageLabel}
                        </span>
                      </div>
                      <Progress value={trait.percentageValue} className="h-1.5 bg-muted" />
                    </div>
                  ))}
                </div>
              </section>
            ))}
            {isLoadingExtraSections
              ? Array.from({ length: expectedExtraSectionCount }).map((_, index) => (
                  <section
                    key={`extra-skeleton-${index}`}
                    className={`min-w-0 space-y-3 ${DASH_RADIUS_CARD} ${DASH_BORDER} ${DASH_SURFACE_CARD} p-3.5 shadow-none`}
                  >
                    <Skeleton className="h-3.5 w-32 rounded-sm" />
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((__, rowIndex) => (
                        <div key={`extra-skeleton-row-${index}-${rowIndex}`} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3.5 w-8" />
                          </div>
                          <Skeleton className="h-1.5 w-full rounded-full" />
                        </div>
                      ))}
                    </div>
                  </section>
                ))
              : visibleExtraSections.map(section => (
                  <section
                    key={section.label}
                    className={`min-w-0 space-y-3 ${DASH_RADIUS_CARD} ${DASH_BORDER} ${DASH_SURFACE_CARD} p-3.5 shadow-none`}
                  >
                    <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground/85">
                      {section.label}
                    </h4>
                    <div className="space-y-3">
                      {section.traits.map(trait => (
                        <div key={`${section.label}-${trait.name}`} className="min-w-0 space-y-1.5">
                          <div className="flex items-center justify-between gap-3 text-sm leading-tight">
                            <span className="min-w-0 break-words text-foreground">{trait.name}</span>
                            <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground/80">
                              {trait.percentageLabel}
                            </span>
                          </div>
                          <Progress value={trait.percentageValue} className="h-1.5 bg-muted" />
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
