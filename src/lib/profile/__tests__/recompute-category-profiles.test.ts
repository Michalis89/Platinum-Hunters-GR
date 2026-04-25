import {
  extractFranchiseKey,
  buildCreditMaps,
  buildStudioMap,
} from '@/lib/profile/recompute-category-profiles';

describe('extractFranchiseKey', () => {
  it('strips subtitle after colon', () => {
    expect(extractFranchiseKey('The Lord of the Rings: The Fellowship of the Ring')).toBe(
      'the lord of the rings',
    );
  });

  it('strips season numbers', () => {
    expect(extractFranchiseKey('Attack on Titan Season 3')).toBe('attack on titan');
  });

  it('strips trailing numerals', () => {
    // apostrophe is stripped by the non-letter/digit regex, space-collapsed
    expect(extractFranchiseKey("Assassin's Creed 2")).toBe('assassin s creed');
  });

  it('returns lowercase trimmed original when normalized becomes empty', () => {
    const key = extractFranchiseKey('2001');
    expect(key).toBeTruthy();
  });
});

describe('buildCreditMaps — franchise dedup for directors', () => {
  it('takes max(points) per franchise family for directors, not the sum', () => {
    const entries = [
      {
        title: 'The Lord of the Rings: The Fellowship of the Ring',
        points: 12,
        credits: { directors: ['Peter Jackson'], actors: [] },
      },
      {
        title: 'The Lord of the Rings: The Two Towers',
        points: 10,
        credits: { directors: ['Peter Jackson'], actors: [] },
      },
      {
        title: 'The Lord of the Rings: The Return of the King',
        points: 11,
        credits: { directors: ['Peter Jackson'], actors: [] },
      },
    ];

    const { directorsMap } = buildCreditMaps(entries);
    // Should be max(12, 10, 11) = 12, not 12+10+11 = 33
    expect(directorsMap.get('Peter Jackson')).toBe(12);
  });

  it('sums across distinct franchise families for directors', () => {
    const entries = [
      {
        title: 'The Lord of the Rings: The Fellowship of the Ring',
        points: 12,
        credits: { directors: ['Peter Jackson'], actors: [] },
      },
      {
        title: 'The Hobbit: An Unexpected Journey',
        points: 8,
        credits: { directors: ['Peter Jackson'], actors: [] },
      },
    ];

    const { directorsMap } = buildCreditMaps(entries);
    // LotR = 12, Hobbit = 8, total = 20
    expect(directorsMap.get('Peter Jackson')).toBe(20);
  });
});

describe('buildCreditMaps — breadth gate for actors', () => {
  it('filters out actors that only appear in a single franchise family', () => {
    const entries = [
      {
        title: 'The Lord of the Rings: The Fellowship of the Ring',
        points: 12,
        credits: { directors: [], actors: ['Elijah Wood', 'Viggo Mortensen'] },
      },
      {
        title: 'The Lord of the Rings: The Two Towers',
        points: 10,
        credits: { directors: [], actors: ['Elijah Wood', 'Viggo Mortensen'] },
      },
      {
        title: 'Interstellar',
        points: 8,
        credits: { directors: [], actors: ['Viggo Mortensen'] },
      },
    ];

    const { actorsMap } = buildCreditMaps(entries);

    // Elijah Wood appears only in LotR franchise → filtered out
    expect(actorsMap.has('Elijah Wood')).toBe(false);

    // Viggo Mortensen appears in LotR + Interstellar → qualifies
    expect(actorsMap.has('Viggo Mortensen')).toBe(true);
  });

  it('gives actors max(points) per family then sums across families', () => {
    const entries = [
      {
        title: 'The Lord of the Rings: The Fellowship of the Ring',
        points: 12,
        credits: { directors: [], actors: ['Viggo Mortensen'] },
      },
      {
        title: 'The Lord of the Rings: The Two Towers',
        points: 10,
        credits: { directors: [], actors: ['Viggo Mortensen'] },
      },
      {
        title: 'Interstellar',
        points: 7,
        credits: { directors: [], actors: ['Viggo Mortensen'] },
      },
    ];

    const { actorsMap } = buildCreditMaps(entries);
    // LotR family: max(12, 10) = 12; Interstellar: 7; total = 19
    expect(actorsMap.get('Viggo Mortensen')).toBe(19);
  });
});

describe('buildStudioMap — franchise dedup for studios/developers', () => {
  it('takes max(points) per franchise family, not the sum', () => {
    const entries = [
      {
        title: 'The Witcher 3: Wild Hunt',
        points: 10,
        studios: ['CD Projekt Red'],
      },
      {
        title: 'The Witcher 3: Wild Hunt - Complete Edition',
        points: 8,
        studios: ['CD Projekt Red'],
      },
    ];

    const result = buildStudioMap(entries);
    // Both map to the same franchise key → max(10, 8) = 10
    expect(result.get('CD Projekt Red')).toBe(10);
  });

  it('sums across distinct franchise families', () => {
    const entries = [
      {
        title: 'The Witcher 3: Wild Hunt',
        points: 10,
        studios: ['CD Projekt Red'],
      },
      {
        title: 'Cyberpunk 2077',
        points: 9,
        studios: ['CD Projekt Red'],
      },
    ];

    const result = buildStudioMap(entries);
    // Two separate franchises → 10 + 9 = 19
    expect(result.get('CD Projekt Red')).toBe(19);
  });

  it('handles anime franchise seasons correctly', () => {
    const entries = [
      { title: 'My Hero Academia Season 1', points: 8, studios: ['Bones'] },
      { title: 'My Hero Academia Season 2', points: 7, studios: ['Bones'] },
      { title: 'My Hero Academia Season 3', points: 9, studios: ['Bones'] },
      { title: 'Fullmetal Alchemist: Brotherhood', points: 10, studios: ['Bones'] },
    ];

    const result = buildStudioMap(entries);
    // MHA family: max(8, 7, 9) = 9; FMA:B = 10; total = 19
    expect(result.get('Bones')).toBe(19);
  });
});
