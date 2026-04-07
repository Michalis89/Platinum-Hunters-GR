/**
 * @jest-environment node
 */

import { __private__ } from '@/lib/recommendations/v2/generic/generic-recommender';

describe('generic recommender franchise eligibility', () => {
  it('maps Monogatari installments to a single franchise key', () => {
    expect(__private__.extractFranchiseBaseKey('Bakemonogatari')).toBe('monogatari');
    expect(__private__.extractFranchiseBaseKey('Monogatari Series: Off & Monster Season')).toBe(
      'monogatari',
    );
  });

  it('treats late Monogatari installments as continuation titles', () => {
    expect(
      __private__.isLikelyContinuationTitle('Monogatari Series: Off & Monster Season'),
    ).toBe(true);
    expect(__private__.isLikelyContinuationTitle('Bakemonogatari')).toBe(false);
  });

  it('blocks sequel-only Monogatari entries when user has no engaged franchise history', () => {
    const emptyHistory = new Set<string>();
    const withHistory = new Set<string>(['monogatari']);

    expect(
      __private__.isEligibleByFranchiseEntryPoint(
        'Monogatari Series: Off & Monster Season',
        'anime',
        emptyHistory,
      ),
    ).toBe(false);

    expect(
      __private__.isEligibleByFranchiseEntryPoint(
        'Monogatari Series: Off & Monster Season',
        'anime',
        withHistory,
      ),
    ).toBe(true);
  });
});

