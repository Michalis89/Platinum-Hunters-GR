'use client';

import { useMemo } from 'react';
import {
  BookOpen,
  Film,
  Gamepad2,
  Library,
  Music,
  Sparkles,
  Tv,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  buildTasteProfile,
  type CategoryTasteProfileItem,
  type DashboardCategoryKey,
  type InsightTagBucket,
} from '@/lib/dashboard/category-data';

const CATEGORY_LABELS: Record<DashboardCategoryKey, string> = {
  games: 'Games',
  anime: 'Anime',
  manga: 'Manga',
  movies: 'Movies',
  tv: 'TV',
  books: 'Books',
};

const CATEGORY_ICONS: Record<DashboardCategoryKey | 'music', LucideIcon> = {
  games: Gamepad2,
  anime: Sparkles,
  manga: BookOpen,
  movies: Film,
  tv: Tv,
  books: Library,
  music: Music,
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
  const tasteProfile = useMemo(() => buildTasteProfile(items, category), [category, items]);
  const Icon = CATEGORY_ICONS[category] ?? Sparkles;
  const categoryLabel = CATEGORY_LABELS[category] ?? 'Category';
  const profileBuckets = useMemo<TasteProfileBarBucket[]>(() => {
    if (category === 'games') {
      return GAME_VISIBLE_BUCKETS.map(bucket => ({
        bucketKey: bucket,
        traits: (tasteProfile.topBuckets[bucket] ?? []).map(trait => ({
          name: trait.name,
          count: trait.count,
          percentageValue: Math.max(0, Math.min(100, trait.percent)),
          percentageLabel: `${Math.round(trait.percent)}%`,
        })),
      }));
    }

    return [
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
  }, [category, tasteProfile.topBuckets, tasteProfile.topGenres]);

  const visibleBuckets = useMemo(
    () =>
      profileBuckets
        .map(bucket => ({
          ...bucket,
          traits: [...bucket.traits]
            .filter(trait => trait.percentageValue >= MIN_VISIBLE_PERCENTAGE)
            .sort((a, b) => {
              if (b.percentageValue !== a.percentageValue)
                {return b.percentageValue - a.percentageValue;}
              return a.name.localeCompare(b.name);
            })
            .slice(0, MAX_TRAITS_PER_BUCKET),
        }))
        .filter(bucket => (category === 'games' ? true : bucket.traits.length > 0)),
    [category, profileBuckets],
  );

  return (
    <Card className="col-span-full w-full border-border/40 bg-card/75 shadow-[0_8px_24px_-24px_rgba(0,0,0,0.85)]">
      <CardHeader className="space-y-1.5 border-b border-border/35 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold tracking-tight">
            {categoryLabel} Taste Profile
          </CardTitle>
          <Icon className="h-4 w-4 text-primary/90" />
        </div>
        <p className="text-xs text-muted-foreground/80">
          Based on {tasteProfile.totalItems} completed + in-progress{' '}
          {category === 'games' ? 'games' : 'items'}
        </p>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        {visibleBuckets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          <div
            className={
              category === 'games' ? 'grid gap-5 md:grid-cols-2 xl:grid-cols-4' : 'space-y-5'
            }
          >
            {visibleBuckets.map(bucket => (
              <section
                key={bucket.bucketKey}
                className="space-y-3 rounded-xl border border-border/30 bg-muted/[0.07] p-3.5"
              >
                <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground/85">
                  {BUCKET_LABELS[bucket.bucketKey]}
                </h4>
                <div className="space-y-3">
                  {bucket.traits.length === 0 ? (
                    <p className="text-xs text-muted-foreground/80">No data yet.</p>
                  ) : (
                    bucket.traits.map(trait => (
                      <div key={`${bucket.bucketKey}-${trait.name}`} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-sm leading-tight">
                          <span className="truncate text-foreground">{trait.name}</span>
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
        )}
      </CardContent>
    </Card>
  );
}
