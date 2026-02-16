export type HobbyModule = 'backlog' | 'news' | 'reviews';

export type HobbyCategory = {
  slug: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  modules: {
    backlog: boolean | 'under-construction';
    news: boolean | 'under-construction';
    reviews: boolean | 'under-construction';
  };
  routes: {
    backlog: string;
    news: string;
    reviews: string;
  };
  requiresAuth: {
    backlog: boolean;
    news: boolean;
    reviews: boolean;
  };
};

export type HobbySectionType = 'backlog' | 'news' | 'reviews';

export type HobbySection = {
  type: HobbySectionType;
  title: string;
  description: string;
  categories: string[]; // slugs
};

export const HOBBY_CATEGORIES: HobbyCategory[] = [
  {
    slug: 'games',
    title: 'Games',
    description: 'Backlog tracking, trophy stats, progress, and achievements for gamers.',
    icon: 'Gamepad2',
    modules: {
      backlog: true,
      news: true,
      reviews: true,
    },
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
  },
  // Anime
  {
    slug: 'anime',
    title: 'Anime',
    description: 'Season tracking, watchlists, and favorites for anime fans.',
    icon: 'Sparkles',
    modules: {
      backlog: true,
      news: true,
      reviews: true,
    },
    routes: {
      backlog: '/backlog?category=anime',
      news: '/articles?category=anime',
      reviews: '/review?category=anime',
    },
    requiresAuth: {
      backlog: true,
      news: false,
      reviews: false,
    },
  },
  // Manga
  {
    slug: 'manga',
    title: 'Manga',
    description: 'Track chapters, volumes, and reading progress for manga fans.',
    icon: 'BookOpen',
    modules: {
      backlog: true,
      news: true,
      reviews: true,
    },
    routes: {
      backlog: '/backlog?category=manga',
      news: '/articles?category=manga',
      reviews: '/review?category=manga',
    },
    requiresAuth: {
      backlog: true,
      news: false,
      reviews: false,
    },
  },
  // Movies
  {
    slug: 'movies',
    title: 'Movies',
    description: 'Watchlists, ratings, and cinematic highlights.',
    icon: 'Film',
    modules: {
      backlog: true,
      news: true,
      reviews: true,
    },
    routes: {
      backlog: '/backlog?category=movies',
      news: '/articles?category=movies',
      reviews: '/review?category=movies',
    },
    requiresAuth: {
      backlog: true,
      news: false,
      reviews: false,
    },
  },
  // TV Shows
  {
    slug: 'tv',
    title: 'TV Shows',
    description: 'Track seasons, progress, and binge-worthy picks.',
    icon: 'Tv',
    modules: {
      backlog: true,
      news: true,
      reviews: true,
    },
    routes: {
      backlog: '/backlog?category=tv',
      news: '/articles?category=tv',
      reviews: '/review?category=tv',
    },
    requiresAuth: {
      backlog: true,
      news: false,
      reviews: false,
    },
  },
  // Books
  {
    slug: 'books',
    title: 'Books',
    description: 'Reading logs, notes, and progress tracking for book lovers.',
    icon: 'Book',
    modules: {
      backlog: true,
      news: true,
      reviews: true,
    },
    routes: {
      backlog: '/backlog?category=books',
      news: '/articles?category=books',
      reviews: '/review?category=books',
    },
    requiresAuth: {
      backlog: true,
      news: false,
      reviews: false,
    },
  },
  // Coding
  {
    slug: 'coding',
    title: 'Coding',
    description: 'Articles, tutorials, and practical guides for developers.',
    icon: 'Code',
    modules: {
      backlog: 'under-construction',
      news: true,
      reviews: false,
    },
    routes: {
      backlog: '/backlog?category=coding',
      news: '/articles?category=coding',
      reviews: '/review?category=coding',
    },
    requiresAuth: {
      backlog: true,
      news: false,
      reviews: false,
    },
  },
  // Pet
  {
    slug: 'pet',
    title: 'Pets',
    description: 'Stories, care guides, and real-world tips for pet owners.',
    icon: 'PawPrint',
    modules: {
      backlog: 'under-construction',
      news: true,
      reviews: false,
    },
    routes: {
      backlog: '/backlog?category=pet',
      news: '/articles?category=pet',
      reviews: '/review?category=pet',
    },
    requiresAuth: {
      backlog: true,
      news: false,
      reviews: false,
    },
  },
  // Vape
  {
    slug: 'vape',
    title: 'Vape',
    description: 'Articles on devices, e-liquids, and buying choices.',
    icon: 'Wind',
    modules: {
      backlog: 'under-construction',
      news: true,
      reviews: true,
    },
    routes: {
      backlog: '/backlog?category=vape',
      news: '/articles?category=vape',
      reviews: '/review?category=vape',
    },
    requiresAuth: {
      backlog: true,
      news: false,
      reviews: false,
    },
  },
];

/**
 * Sections for organizing the hobbies directory
 */
export const HOBBY_SECTIONS: HobbySection[] = [
  {
    type: 'backlog',
    title: 'Backlog & Progress',
    description: 'Organize your hobbies with statuses, progress, and notes.',
    categories: ['games', 'anime', 'manga', 'movies', 'tv', 'books'],
  },
  {
    type: 'news',
    title: 'News & Articles',
    description: 'Discover articles, tutorials, and stories from the community.',
    categories: ['games', 'anime', 'manga', 'books', 'movies', 'tv', 'coding', 'pet', 'vape'],
  },
  {
    type: 'reviews',
    title: 'Reviews',
    description: 'Read honest reviews and member impressions.',
    categories: ['games', 'anime', 'manga', 'books', 'movies', 'tv', 'vape'],
  },
];

/**
 * Helper to get a category by slug
 */
export function getCategoryBySlug(slug: string): HobbyCategory | undefined {
  return HOBBY_CATEGORIES.find(cat => cat.slug === slug);
}

/**
 * Helper to check if a module is available for a category
 */
export function isModuleAvailable(category: HobbyCategory, module: HobbyModule): boolean {
  return category.modules[module] === true;
}

/**
 * Helper to check if a module is under construction
 */
export function isModuleUnderConstruction(category: HobbyCategory, module: HobbyModule): boolean {
  return category.modules[module] === 'under-construction';
}

/**
 * Helper to get categories for a section
 */
export function getCategoriesForSection(section: HobbySection): HobbyCategory[] {
  return section.categories
    .map(slug => getCategoryBySlug(slug))
    .filter((cat): cat is HobbyCategory => cat !== undefined);
}
