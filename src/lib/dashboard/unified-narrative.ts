export type UnifiedNarrativeCategory = {
  key: string;
  inProgress: number;
  recentlyFinished: number;
  recentActivityCount: number;
};

export type UnifiedNarrativeInput = {
  categories: UnifiedNarrativeCategory[];
  enabledCategoryKeys: string[];
};

const CATEGORY_LABELS: Record<string, string> = {
  games: 'Games',
  anime: 'Anime',
  manga: 'Manga',
  movies: 'Movies',
  tv: 'TV',
  books: 'Books',
};

const DEFAULT_MESSAGE = 'Your space is quiet right now.';
const MAX_NARRATIVE_LENGTH = 140;

const toSafeNumber = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0);

const toCategoryLabel = (key: string) =>
  CATEGORY_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);

const clampNarrativeLength = (value: string) => {
  if (value.length <= MAX_NARRATIVE_LENGTH) {
    return value;
  }
  return DEFAULT_MESSAGE;
};

export function buildNarrative(input: UnifiedNarrativeInput): string | null {
  const enabledSet = new Set((input.enabledCategoryKeys ?? []).filter(Boolean));
  const categories = (input.categories ?? [])
    .filter(category => enabledSet.has(category.key))
    .map(category => ({
      key: category.key,
      inProgress: toSafeNumber(category.inProgress),
      recentlyFinished: toSafeNumber(category.recentlyFinished),
      recentActivityCount: toSafeNumber(category.recentActivityCount),
    }));

  if (categories.length < 2) {
    return null;
  }

  let activeCount = 0;
  let top: (typeof categories)[number] | null = null;
  let second: (typeof categories)[number] | null = null;
  let third: (typeof categories)[number] | null = null;

  for (const category of categories) {
    if (category.recentActivityCount > 0) {
      activeCount += 1;
    }

    if (!top || category.recentActivityCount > top.recentActivityCount) {
      third = second;
      second = top;
      top = category;
      continue;
    }

    if (!second || category.recentActivityCount > second.recentActivityCount) {
      third = second;
      second = category;
      continue;
    }

    if (!third || category.recentActivityCount > third.recentActivityCount) {
      third = category;
    }
  }

  if (!top) {
    return DEFAULT_MESSAGE;
  }

  if (activeCount === 0) {
    return DEFAULT_MESSAGE;
  }

  if (activeCount === 1) {
    return clampNarrativeLength(`Most of your time has been in ${toCategoryLabel(top.key)}.`);
  }

  const topActivity = top.recentActivityCount;
  const secondActivity = second?.recentActivityCount ?? 0;
  const thirdActivity = third?.recentActivityCount ?? 0;
  const isDominant = secondActivity > 0 && topActivity >= secondActivity * 1.3;
  const isEvenSpread = activeCount >= 3 && thirdActivity > 0 && topActivity <= thirdActivity * 1.2;

  if (isEvenSpread) {
    return "You've been active across several categories lately.";
  }

  if (isDominant) {
    return clampNarrativeLength(
      `Lately, you've been mostly focused on ${toCategoryLabel(top.key)}.`,
    );
  }

  if (!second) {
    return DEFAULT_MESSAGE;
  }

  return clampNarrativeLength(
    `You've been splitting your time between ${toCategoryLabel(top.key)} and ${toCategoryLabel(second.key)}.`,
  );
}
