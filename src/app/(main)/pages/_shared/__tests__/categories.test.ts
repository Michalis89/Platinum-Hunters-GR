import { getVisibleCategories } from '@/app/(main)/pages/_shared/categories';
import { CATEGORY_LABELS } from '@/app/(main)/articles/constants';

describe('getVisibleCategories', () => {
  it('returns all categories for news scope', () => {
    const expected = Object.keys(CATEGORY_LABELS);
    const result = getVisibleCategories({ scope: 'news' });

    expect(result).toEqual(expected);
  });

  it('excludes coding and pet for reviews scope', () => {
    const result = getVisibleCategories({ scope: 'reviews' });

    expect(result).not.toContain('coding');
    expect(result).not.toContain('pet');
    expect(result).toEqual(
      Object.keys(CATEGORY_LABELS).filter(category => category !== 'coding' && category !== 'pet'),
    );
  });
});
