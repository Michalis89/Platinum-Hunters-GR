import { CATEGORY_LABELS, CATEGORY_SUBTITLES, TOPIC_LABELS } from '@/app/(main)/articles/constants';

describe('articles constants', () => {
  it('defines labels and subtitles for primary article categories', () => {
    expect(CATEGORY_LABELS.games).toBe('Games');
    expect(CATEGORY_LABELS.tv).toBe('TV');
    expect(CATEGORY_LABELS.vape).toBe('Vape');

    expect(CATEGORY_SUBTITLES.games).toContain('gaming');
    expect(CATEGORY_SUBTITLES.coding).toContain('coding');
    expect(CATEGORY_SUBTITLES.pet).toContain('Pet');
  });

  it('defines topic labels used across articles pages', () => {
    expect(TOPIC_LABELS.articles).toBe('Articles');
    expect(TOPIC_LABELS.reviews).toBe('Reviews');
    expect(TOPIC_LABELS['weird-cases']).toBe('Edge Cases');
    expect(TOPIC_LABELS.liquids).toBe('E-Liquids');
  });
});
