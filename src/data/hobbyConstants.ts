export const COUNTRIES = ['GR', 'US', 'UK', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'Other'];
export const PLATFORMS = [
  'PS5',
  'PS4',
  'PS3',
  'Xbox Series X/S',
  'Xbox One',
  'Nintendo Switch',
  'PC',
];

export const GENRES = [
  'Action',
  'RPG',
  'Adventure',
  'Shooter',
  'Sports',
  'Racing',
  'Fighting',
  'Puzzle',
  'Horror',
  'Platform',
];

export const CATEGORIES = [
  'games',
  'anime',
  'manga',
  'books',
  'movies',
  'tv',
  'coding',
  'pet',
  'vape',
] as const;

export const CATEGORY_SERVICES: Record<string, string[]> = {
  anime: ['Anilist', 'MyAnimeList', 'Crunchyroll', 'Netflix', 'Other'],
  manga: ['Anilist', 'MyAnimeList', 'MangaPlus', 'Comixology', 'Other'],
  books: ['Goodreads', 'StoryGraph', 'Kindle', 'Audible', 'Other'],
  movies: [
    'Netflix',
    'HBO / Max',
    'Disney+',
    'Amazon Prime',
    'Apple TV+',
    'Hulu',
    'Cinema',
    'Blu-ray / Physical',
    'Other',
  ],
  tv: ['Netflix', 'HBO / Max', 'Disney+', 'Amazon Prime', 'Apple TV+', 'Hulu', 'Other'],
};

export const TV_GENRES = [
  'Action',
  'Drama',
  'Comedy',
  'Sci-Fi',
  'Fantasy',
  'Thriller',
  'Crime',
  'Mystery',
  'Horror',
  'Romance',
  'Documentary',
  'Animated',
  'Sitcom',
  'Superhero',
];

export const TV_STYLES = ['Binge watching', '1–2 episodes per day', 'Weekly releases', 'Depends'];

export const MOVIE_GENRES = [
  'Action',
  'Adventure',
  'Sci-Fi',
  'Fantasy',
  'Comedy',
  'Drama',
  'Thriller',
  'Crime',
  'Mystery',
  'Horror',
  'Romance',
  'Documentary',
  'Animation',
  'Superhero',
  'War',
  'Western',
  'Musical',
  'Biography',
  'Historical',
];

export const MOVIE_STYLES = [
  'Cinema first',
  'Streaming only',
  'Depends on the movie',
  'Watch occasionally',
  'Movie marathon sessions',
];

export const ANIME_GENRES = [
  'Shōnen',
  'Seinen',
  'Shōjo',
  'Josei',
  'Isekai',
  'Fantasy',
  'Sci-Fi',
  'Mecha',
  'Action',
  'Adventure',
  'Romance',
  'Drama',
  'Mystery',
  'Horror',
  'Thriller',
  'Comedy',
  'Slice of Life',
  'Supernatural',
  'Psychological',
  'Sports',
  'Historical',
  'Music',
];

export const BOOK_GENRES = [
  'Fantasy',
  'Sci-Fi',
  'Mystery',
  'Thriller',
  'Horror',
  'Romance',
  'Historical Fiction',
  'Drama / Literary Fiction',
  'Adventure',
  'Crime',
  'Philosophy',
  'Psychology',
  'Biography',
  'Self-help',
  'Poetry',
  'Comics / Graphic Novels',
  'Young Adult',
  'Children’s Literature',
];

export const CODING_LANGUAGES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'C#',
  'C++',
  'Java',
  'Go',
  'Rust',
  'PHP',
  'Ruby',
  'Other',
];
export const CODING_FOCUS = [
  'Web',
  'Mobile',
  'Backend',
  'Game Dev',
  'Data',
  'DevOps',
  'Embedded',
  'Other',
];

export const PET_TYPES = ['Σκύλος', 'Γάτα', 'Πτηνά', 'Ψάρια', 'Ερπετά', 'Άλλα'];

export const VAPE_DEVICES = ['Pod', 'Mod', 'Disposable', 'MTL', 'DTL', 'Άλλα'];

export const VAPE_FLAVORS = ['Tobacco', 'Dessert', 'Fruits', 'Menthol', 'Drinks', 'Άλλα'];
