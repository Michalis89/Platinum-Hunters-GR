export const IGDB_MAIN_GAME_CATEGORY = 0;
export const ALLOWED_IGDB_GAME_CATEGORIES = [0, 1, 2, 3, 4, 8, 9, 13, 14] as const;
const ALLOWED_IGDB_GAME_CATEGORY_SET = new Set<number>(ALLOWED_IGDB_GAME_CATEGORIES);

const IGDB_CATEGORY_LABELS: Record<number, string> = {
  0: 'main_game',
  1: 'dlc',
  2: 'expansion',
  3: 'bundle',
  4: 'standalone_expansion',
  5: 'mod',
  6: 'episode',
  7: 'season',
  8: 'remake',
  9: 'remaster',
  10: 'expanded_game',
  11: 'port',
  12: 'fork',
  13: 'pack',
  14: 'update',
};

export const EXCLUDED_IGDB_TITLE_MARKERS = [
  'compilation',
  'collector',
  'expanded',
  'mod',
  'season pass',
];

export function getIgdbCategoryLabel(category: number | null | undefined): string {
  if (typeof category !== 'number' || !Number.isFinite(category)) {
    return 'unknown';
  }
  return IGDB_CATEGORY_LABELS[category] ?? `category_${category}`;
}

export function isMainGameCategory(category: number | null | undefined): boolean {
  return category === IGDB_MAIN_GAME_CATEGORY;
}

export function isAllowedIgdbCategory(category: number | null | undefined): boolean {
  return typeof category === 'number' && ALLOWED_IGDB_GAME_CATEGORY_SET.has(category);
}

export function isExplicitlyExcludedCategory(category: number | null | undefined): boolean {
  return (
    typeof category === 'number' && Number.isFinite(category) && !isAllowedIgdbCategory(category)
  );
}

export function igdbAllowedCategoriesWhereClause(): string {
  return `(${ALLOWED_IGDB_GAME_CATEGORIES.join(',')})`;
}

export function isExcludedByTitleOrSlug(
  title: string | null | undefined,
  slug: string | null | undefined,
): boolean {
  const normalized = `${title ?? ''} ${slug ?? ''}`.toLowerCase();
  return EXCLUDED_IGDB_TITLE_MARKERS.some(marker => normalized.includes(marker));
}

export function isAllowedIgdbGameCandidate(input: {
  category?: number | null;
  name?: string | null;
  slug?: string | null;
}): boolean {
  if (isAllowedIgdbCategory(input.category)) {
    return true;
  }
  if (typeof input.category === 'number') {
    return false;
  }
  return !isExcludedByTitleOrSlug(input.name, input.slug);
}
