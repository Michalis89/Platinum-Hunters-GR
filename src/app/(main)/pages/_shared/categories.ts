import type { ArticleCategory } from '@/types/database';
import { CATEGORY_LABELS } from '@/app/(main)/articles/constants';

const REVIEW_EXCLUSIONS: ArticleCategory[] = ['coding', 'pet'];

export type CategoryScope = 'news' | 'reviews';

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as ArticleCategory[];

export function getVisibleCategories({ scope }: { scope: CategoryScope }): ArticleCategory[] {
  if (scope === 'reviews') {
    return ALL_CATEGORIES.filter(category => !REVIEW_EXCLUSIONS.includes(category));
  }

  return ALL_CATEGORIES;
}
