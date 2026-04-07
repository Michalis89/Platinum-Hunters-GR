'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
} from './dashboard-ui-tokens';

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
const MAX_SPLIT_TRAITS_PER_BUCKET = 10;

const WEAK_METADATA_GENRES = new Set([
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

const shouldSplitGenreBuckets = (category: DashboardCategoryKey) =>
  category === 'anime' || category === 'manga';

const isWeakMetadataGenre = (genre: string) => WEAK_METADATA_GENRES.has(genre.toLowerCase());

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
  profileNote?: Record<string, unknown> | null;
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is string | number => typeof item === 'string' || typeof item === 'number',
      )
      .map(item => String(item).trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }
  return [];
};

const toTraits = (items: string[]): TasteProfileBarTrait[] => {
  const unique = Array.from(new Set(items.filter(Boolean))).slice(0, MAX_TRAITS_PER_BUCKET);
  if (unique.length === 0) {
    return [];
  }
  const percentage = 100 / unique.length;
  return unique.map(name => ({
    name,
    count: 1,
    percentageValue: percentage,
    percentageLabel: `${Math.round(percentage)}%`,
  }));
};

const buildExtraSectionsFromProfile = (
  category: DashboardCategoryKey,
  profileNote?: Record<string, unknown> | null,
): ExtraTraitSection[] => {
  if (!profileNote || typeof profileNote !== 'object') {
    return [];
  }

  const sections: ExtraTraitSection[] = [];
  const pushIfAny = (label: string, values: string[]) => {
    const traits = toTraits(values);
    if (traits.length > 0) {
      sections.push({ label, traits });
    }
  };

  if (category === 'movies' || category === 'tv') {
    pushIfAny('Favorite Directors', toStringArray(profileNote.directors));
    pushIfAny('Favorite Actors', toStringArray(profileNote.actors));
    pushIfAny(
      category === 'movies' ? 'Streaming Services' : 'Platforms / Services',
      toStringArray(profileNote.services),
    );
    return sections;
  }

  if (category === 'anime') {
    pushIfAny('Favorite Studios', toStringArray(profileNote.favorite_studios));
    pushIfAny('Platforms', toStringArray(profileNote.platforms));
    return sections;
  }

  if (category === 'books') {
    pushIfAny('Favorite Authors', toStringArray(profileNote.authors));
    pushIfAny('Languages', toStringArray(profileNote.languages));
    return sections;
  }

  if (category === 'manga') {
    pushIfAny('Favorite Authors', toStringArray(profileNote.authors));
    return sections;
  }

  return sections;
};

export default function CategoryTasteProfileCard({
  category,
  items,
  profileNote,
}: CategoryTasteProfileCardProps) {
  const tasteProfile = buildTasteProfile(items, category);
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
        .slice(
          0,
          shouldSplitGenreBuckets(category) && bucket.bucketKey === 'genre'
            ? MAX_SPLIT_TRAITS_PER_BUCKET
            : MAX_TRAITS_PER_BUCKET,
        ),
    }))
    .filter(bucket => (category === 'games' ? true : bucket.traits.length > 0));

  const visibleExtraSections = useMemo(
    () =>
      buildExtraSectionsFromProfile(category, profileNote)
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
    [category, profileNote],
  );

  const nonGamesCardCount = visibleBuckets.length + visibleExtraSections.length;
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
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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
                      <div
                        key={`${bucket.bucketKey}-${trait.name}`}
                        className="min-w-0 space-y-1.5"
                      >
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
                  {shouldSplitGenreBuckets(category) && bucket.bucketKey === 'genre' ? (
                    (() => {
                      const nonWeak = bucket.traits.filter(
                        trait => !isWeakMetadataGenre(trait.name),
                      );
                      const weak = bucket.traits.filter(trait => isWeakMetadataGenre(trait.name));
                      const topTraits = (nonWeak.length > 0 ? nonWeak : bucket.traits).slice(
                        0,
                        MAX_TRAITS_PER_BUCKET,
                      );
                      const supportingTraits = (
                        weak.length > 0
                          ? weak
                          : nonWeak.slice(MAX_TRAITS_PER_BUCKET, MAX_SPLIT_TRAITS_PER_BUCKET)
                      ).slice(0, MAX_TRAITS_PER_BUCKET);

                      return (
                        <>
                          <div className="space-y-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground/80">
                              Top Genres
                            </p>
                            {topTraits.map(trait => (
                              <div
                                key={`${bucket.bucketKey}-top-${trait.name}`}
                                className="min-w-0 space-y-1.5"
                              >
                                <div className="flex items-center justify-between gap-3 text-sm leading-tight">
                                  <span className="min-w-0 break-words text-foreground">
                                    {trait.name}
                                  </span>
                                  <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground/80">
                                    {trait.percentageLabel}
                                  </span>
                                </div>
                                <Progress value={trait.percentageValue} className="h-1.5 bg-muted" />
                              </div>
                            ))}
                          </div>
                          {supportingTraits.length > 0 ? (
                            <div className="space-y-3 pt-1">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground/80">
                                Supporting Genres
                              </p>
                              {supportingTraits.map(trait => (
                                <div
                                  key={`${bucket.bucketKey}-support-${trait.name}`}
                                  className="min-w-0 space-y-1.5"
                                >
                                  <div className="flex items-center justify-between gap-3 text-sm leading-tight">
                                    <span className="min-w-0 break-words text-foreground">
                                      {trait.name}
                                    </span>
                                    <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground/80">
                                      {trait.percentageLabel}
                                    </span>
                                  </div>
                                  <Progress value={trait.percentageValue} className="h-1.5 bg-muted" />
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </>
                      );
                    })()
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
            {visibleExtraSections.map(section => (
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
