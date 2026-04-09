import {
  extractBaseTitle,
  isEditionVariant,
} from '../utils/franchise';

describe('franchise variant handling', () => {
  it('detects common edition/update variants', () => {
    expect(isEditionVariant('Dark Souls: Remastered')).toBe(true);
    expect(isEditionVariant('The Witcher 3: Wild Hunt - Free Next-Gen Update')).toBe(true);
  });

  it('normalizes variant titles back to base title', () => {
    expect(extractBaseTitle('Dark Souls: Remastered')).toBe('dark souls');
    expect(extractBaseTitle('The Witcher 3: Wild Hunt - Free Next-Gen Update')).toBe('the witcher 3 wild hunt');
  });

  it('does not flag normal titles as variants', () => {
    expect(isEditionVariant('Bloodborne')).toBe(false);
  });
});
