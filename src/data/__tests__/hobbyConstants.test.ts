import {
  ANIME_GENRES,
  BOOK_GENRES,
  CATEGORIES,
  CATEGORY_SERVICES,
  CODING_FOCUS,
  CODING_LANGUAGES,
  COUNTRIES,
  GENRES,
  MOVIE_GENRES,
  MOVIE_STYLES,
  PET_TYPES,
  PLATFORMS,
  TV_GENRES,
  TV_STYLES,
  VAPE_DEVICES,
  VAPE_FLAVORS,
} from '@/data/hobbyConstants';

describe('hobbyConstants', () => {
  it('exports core country/platform/category constants', () => {
    expect(COUNTRIES).toEqual(expect.arrayContaining(['GR', 'US', 'Other']));
    expect(PLATFORMS).toEqual(
      expect.arrayContaining(['PS5', 'Xbox Series X/S', 'Nintendo Switch', 'PC']),
    );
    expect(CATEGORIES).toEqual([
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
  });

  it('exports services map for media categories', () => {
    expect(Object.keys(CATEGORY_SERVICES).sort()).toEqual([
      'anime',
      'books',
      'manga',
      'movies',
      'tv',
    ]);
    expect(CATEGORY_SERVICES.anime).toEqual(
      expect.arrayContaining(['Anilist', 'MyAnimeList', 'Crunchyroll']),
    );
    expect(CATEGORY_SERVICES.movies).toEqual(
      expect.arrayContaining(['Netflix', 'Cinema', 'Blu-ray / Physical']),
    );
  });

  it('exports genre/style catalogs', () => {
    expect(GENRES).toEqual(
      expect.arrayContaining(['Action', 'RPG', 'Adventure', 'Shooter', 'Horror']),
    );
    expect(TV_GENRES).toEqual(expect.arrayContaining(['Drama', 'Comedy', 'Documentary']));
    expect(TV_STYLES).toHaveLength(4);
    expect(MOVIE_GENRES).toEqual(expect.arrayContaining(['Action', 'Thriller', 'Biography']));
    expect(MOVIE_STYLES).toEqual(
      expect.arrayContaining(['Cinema first', 'Streaming only', 'Movie marathon sessions']),
    );
    expect(ANIME_GENRES).toEqual(expect.arrayContaining(['Isekai', 'Mecha', 'Slice of Life']));
    expect(BOOK_GENRES).toEqual(
      expect.arrayContaining(['Fantasy', 'Philosophy', 'Comics / Graphic Novels']),
    );
  });

  it('exports coding/pet/vape catalogs', () => {
    expect(CODING_LANGUAGES).toEqual(
      expect.arrayContaining(['JavaScript', 'TypeScript', 'Python', 'Other']),
    );
    expect(CODING_FOCUS).toEqual(expect.arrayContaining(['Web', 'Backend', 'DevOps', 'Other']));
    expect(PET_TYPES).toEqual(expect.arrayContaining(['Dog', 'Cat', 'Other']));
    expect(VAPE_DEVICES).toEqual(expect.arrayContaining(['Pod', 'Mod', 'Other']));
    expect(VAPE_FLAVORS).toEqual(expect.arrayContaining(['Tobacco', 'Fruits', 'Other']));
  });
});
