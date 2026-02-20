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
  DASH_SURFACE_SECTION,
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
        .slice(0, MAX_TRAITS_PER_BUCKET),
    }))
    .filter(bucket => (category === 'games' ? true : bucket.traits.length > 0));

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
        ) : (
          <div
            className={
              category === 'games' ? 'grid gap-5 md:grid-cols-2 xl:grid-cols-4' : 'space-y-5'
            }
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
        )}
      </CardContent>
    </Card>
  );
}
