import {
  HOBBY_CATEGORIES,
  HOBBY_SECTIONS,
  getCategoriesForSection,
  getCategoryBySlug,
  isModuleAvailable,
  isModuleUnderConstruction,
} from '@/config/hobbies';

describe('hobbies config', () => {
  it('exposes unique category slugs with expected route and auth settings', () => {
    const slugs = HOBBY_CATEGORIES.map(category => category.slug);

    expect(new Set(slugs).size).toBe(HOBBY_CATEGORIES.length);
    expect(slugs).toEqual([
      'games',
      'anime',
      'manga',
      'movies',
      'tv',
      'books',
      'coding',
      'pet',
      'vape',
    ]);

    expect(getCategoryBySlug('games')).toMatchObject({
      routes: {
        backlog: '/backlog',
        news: '/articles?category=games',
        reviews: '/review?category=games',
      },
      requiresAuth: {
        backlog: true,
        news: false,
        reviews: false,
      },
    });
  });

  it('returns the matching category for a known slug and undefined for unknown slugs', () => {
    expect(getCategoryBySlug('anime')).toMatchObject({
      slug: 'anime',
      title: 'Anime',
      icon: 'Sparkles',
    });
    expect(getCategoryBySlug('missing-slug')).toBeUndefined();
  });

  it('reports module availability correctly for built and disabled modules', () => {
    const games = getCategoryBySlug('games');
    const coding = getCategoryBySlug('coding');
    const vape = getCategoryBySlug('vape');

    expect(games).toBeDefined();
    expect(coding).toBeDefined();
    expect(vape).toBeDefined();

    expect(isModuleAvailable(games!, 'backlog')).toBe(true);
    expect(isModuleAvailable(games!, 'news')).toBe(true);
    expect(isModuleAvailable(games!, 'reviews')).toBe(true);

    expect(isModuleAvailable(coding!, 'backlog')).toBe(false);
    expect(isModuleAvailable(coding!, 'reviews')).toBe(false);
    expect(isModuleAvailable(vape!, 'reviews')).toBe(true);
  });

  it('reports under-construction modules correctly', () => {
    const coding = getCategoryBySlug('coding');
    const pet = getCategoryBySlug('pet');
    const books = getCategoryBySlug('books');

    expect(isModuleUnderConstruction(coding!, 'backlog')).toBe(true);
    expect(isModuleUnderConstruction(pet!, 'backlog')).toBe(true);
    expect(isModuleUnderConstruction(books!, 'backlog')).toBe(false);
    expect(isModuleUnderConstruction(books!, 'reviews')).toBe(false);
  });

  it('maps each section to the expected concrete categories', () => {
    expect(HOBBY_SECTIONS.map(section => section.type)).toEqual(['backlog', 'news', 'reviews']);

    const backlog = getCategoriesForSection(HOBBY_SECTIONS[0]);
    const news = getCategoriesForSection(HOBBY_SECTIONS[1]);
    const reviews = getCategoriesForSection(HOBBY_SECTIONS[2]);

    expect(backlog.map(category => category.slug)).toEqual([
      'games',
      'anime',
      'manga',
      'movies',
      'tv',
      'books',
    ]);
    expect(news.map(category => category.slug)).toEqual([
      'games',
      'anime',
      'manga',
      'books',
      'movies',
      'tv',
      'coding',
      'pet',
      'vape',
    ]);
    expect(reviews.map(category => category.slug)).toEqual([
      'games',
      'anime',
      'manga',
      'books',
      'movies',
      'tv',
      'vape',
    ]);
  });

  it('filters out unknown slugs when resolving categories for a section', () => {
    const categories = getCategoriesForSection({
      type: 'news',
      title: 'Mixed',
      description: 'Contains valid and invalid slugs.',
      categories: ['games', 'unknown', 'books'],
    });

    expect(categories.map(category => category.slug)).toEqual(['games', 'books']);
  });
});
