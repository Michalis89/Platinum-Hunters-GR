/**
 * Hobbies Configuration
 * Single source of truth for all hobby categories and module availability
 */

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

/**
 * All hobby categories with their configurations
 * Extracted from existing codebase:
 * - MediaCategory: anime, manga, books, movies, tv (from CategoryLibrary.tsx)
 * - ArticleCategory: gaming, coding, pet, vape (from database.ts)
 * - Gaming backlog: default backlog without category param
 */
export const HOBBY_CATEGORIES: HobbyCategory[] = [
  // Gaming (special case - uses default backlog, not category param)
  {
    slug: 'gaming',
    title: 'Gaming',
    description: 'Backlog, trophy guides, πρόοδος και achievements για gamers.',
    icon: 'Gamepad2',
    modules: {
      backlog: true,
      news: true,
      reviews: 'under-construction',
    },
    routes: {
      backlog: '/pages/backlog',
      news: '/pages/news?category=gaming',
      reviews: '/pages/reviews?category=gaming',
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
    description: 'Season tracking, watchlist και favorites για anime lovers.',
    icon: 'Sparkles',
    modules: {
      backlog: true,
      news: 'under-construction',
      reviews: 'under-construction',
    },
    routes: {
      backlog: '/pages/backlog?category=anime',
      news: '/pages/news?category=anime',
      reviews: '/pages/reviews?category=anime',
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
    description: 'Chapters, volumes και reading progress για manga fans.',
    icon: 'BookOpen',
    modules: {
      backlog: true,
      news: 'under-construction',
      reviews: 'under-construction',
    },
    routes: {
      backlog: '/pages/backlog?category=manga',
      news: '/pages/news?category=manga',
      reviews: '/pages/reviews?category=manga',
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
    title: 'Ταινίες',
    description: 'Watchlist, ratings και cinematic highlights.',
    icon: 'Film',
    modules: {
      backlog: true,
      news: 'under-construction',
      reviews: 'under-construction',
    },
    routes: {
      backlog: '/pages/backlog?category=movies',
      news: '/pages/news?category=movies',
      reviews: '/pages/reviews?category=movies',
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
    title: 'Σειρές',
    description: 'Series tracking, season progress και binge-watching lists.',
    icon: 'Tv',
    modules: {
      backlog: true,
      news: 'under-construction',
      reviews: 'under-construction',
    },
    routes: {
      backlog: '/pages/backlog?category=tv',
      news: '/pages/news?category=tv',
      reviews: '/pages/reviews?category=tv',
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
    title: 'Βιβλία',
    description: 'Reading log, notes και progress tracking για bookworms.',
    icon: 'Book',
    modules: {
      backlog: true,
      news: 'under-construction',
      reviews: 'under-construction',
    },
    routes: {
      backlog: '/pages/backlog?category=books',
      news: '/pages/news?category=books',
      reviews: '/pages/reviews?category=books',
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
    description: 'Άρθρα, tutorials και οδηγοί για developers.',
    icon: 'Code',
    modules: {
      backlog: 'under-construction',
      news: true,
      reviews: 'under-construction',
    },
    routes: {
      backlog: '/pages/backlog?category=coding',
      news: '/pages/news?category=coding',
      reviews: '/pages/reviews?category=coding',
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
    title: 'Κατοικίδια',
    description: 'Ιστορίες, οδηγοί φροντίδας και εμπειρίες για pet owners.',
    icon: 'PawPrint',
    modules: {
      backlog: 'under-construction',
      news: true,
      reviews: 'under-construction',
    },
    routes: {
      backlog: '/pages/backlog?category=pet',
      news: '/pages/news?category=pet',
      reviews: '/pages/reviews?category=pet',
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
    description: 'Άρθρα για συσκευές, υγρά και επιλογές.',
    icon: 'Wind',
    modules: {
      backlog: 'under-construction',
      news: true,
      reviews: 'under-construction',
    },
    routes: {
      backlog: '/pages/backlog?category=vape',
      news: '/pages/news?category=vape',
      reviews: '/pages/reviews?category=vape',
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
    title: 'Backlog & Πρόοδος',
    description: 'Οργάνωσε τα hobbies σου με status, progress και notes.',
    categories: ['gaming', 'anime', 'manga', 'movies', 'tv', 'books'],
  },
  {
    type: 'news',
    title: 'Άρθρα & Νέα',
    description: 'Διάβασε άρθρα, tutorials και ιστορίες από την κοινότητα.',
    categories: ['gaming', 'coding', 'pet', 'vape'],
  },
  {
    type: 'reviews',
    title: 'Κριτικές',
    description: 'Κριτικές και εντυπώσεις από τα μέλη της κοινότητας.',
    categories: ['gaming', 'anime', 'manga', 'movies', 'tv', 'books'],
  },
];

/**
 * Helper to get a category by slug
 */
export function getCategoryBySlug(slug: string): HobbyCategory | undefined {
  return HOBBY_CATEGORIES.find((cat) => cat.slug === slug);
}

/**
 * Helper to check if a module is available for a category
 */
export function isModuleAvailable(
  category: HobbyCategory,
  module: HobbyModule
): boolean {
  return category.modules[module] === true;
}

/**
 * Helper to check if a module is under construction
 */
export function isModuleUnderConstruction(
  category: HobbyCategory,
  module: HobbyModule
): boolean {
  return category.modules[module] === 'under-construction';
}

/**
 * Helper to get categories for a section
 */
export function getCategoriesForSection(section: HobbySection): HobbyCategory[] {
  return section.categories
    .map((slug) => getCategoryBySlug(slug))
    .filter((cat): cat is HobbyCategory => cat !== undefined);
}
