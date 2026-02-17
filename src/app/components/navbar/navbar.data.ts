import {
  Book,
  BookOpen,
  Cloud,
  Code,
  FileText,
  Film,
  Gamepad2,
  Home,
  ListChecks,
  MessageCircle,
  PawPrint,
  Sparkles,
  Star,
  Tv,
  type LucideIcon,
} from 'lucide-react';

export type NavbarFeatureName = 'articles' | 'reviews';

export type NavbarLinkItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  devOnly?: boolean;
  requiresAuth?: boolean;
  feature?: NavbarFeatureName;
};

export type HobbyChildItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  feature?: NavbarFeatureName | undefined;
};

export type HobbyItem = NavbarLinkItem & {
  category?: string;
  children?: HobbyChildItem[];
};

export const NAV_ITEMS: NavbarLinkItem[] = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/about', label: 'About', icon: Book },
  { href: '/articles', label: 'Articles', icon: FileText, feature: 'articles' },
  { href: '/review', label: 'Reviews', icon: Star, feature: 'reviews' },
  { href: '/support', label: 'Support', icon: MessageCircle, requiresAuth: true },
];

export const HOBBY_ITEMS: HobbyItem[] = [
  {
    href: '/backlog?category=games',
    label: 'Games',
    icon: Gamepad2,
    category: 'games',
    children: [
      {
        href: '/articles?category=games',
        label: 'Articles',
        icon: FileText,
        feature: 'articles',
      },
      { href: '/backlog?category=games', label: 'Gaming Backlog', icon: ListChecks },
      {
        href: '/review?category=games',
        label: 'Reviews',
        icon: Star,
        feature: 'reviews',
      },
    ],
  },
  {
    href: '/backlog?category=anime',
    label: 'Anime',
    icon: Sparkles,
    category: 'anime',
    children: [
      {
        href: '/articles?category=anime',
        label: 'Articles',
        icon: FileText,
        feature: 'articles',
      },
      { href: '/backlog?category=anime', label: 'Anime Library', icon: ListChecks },
      {
        href: '/review?category=anime',
        label: 'Reviews',
        icon: Star,
        feature: 'reviews',
      },
    ],
  },
  {
    href: '/backlog?category=manga',
    label: 'Manga',
    icon: BookOpen,
    category: 'manga',
    children: [
      {
        href: '/articles?category=manga',
        label: 'Articles',
        icon: FileText,
        feature: 'articles',
      },
      { href: '/backlog?category=manga', label: 'Manga Library', icon: ListChecks },
      {
        href: '/review?category=manga',
        label: 'Reviews',
        icon: Star,
        feature: 'reviews',
      },
    ],
  },
  {
    href: '/backlog?category=movies',
    label: 'Movies',
    icon: Film,
    category: 'movies',
    children: [
      {
        href: '/articles?category=movies',
        label: 'Articles',
        icon: FileText,
        feature: 'articles',
      },
      { href: '/backlog?category=movies', label: 'Movie Library', icon: ListChecks },
      {
        href: '/review?category=movies',
        label: 'Reviews',
        icon: Star,
        feature: 'reviews',
      },
    ],
  },
  {
    href: '/backlog?category=tv',
    label: 'TV Series',
    icon: Tv,
    category: 'tv',
    children: [
      {
        href: '/articles?category=tv',
        label: 'Articles',
        icon: FileText,
        feature: 'articles',
      },
      { href: '/backlog?category=tv', label: 'TV Library', icon: ListChecks },
      {
        href: '/review?category=tv',
        label: 'Reviews',
        icon: Star,
        feature: 'reviews',
      },
    ],
  },
  {
    href: '/backlog?category=books',
    label: 'Books',
    icon: BookOpen,
    category: 'books',
    children: [
      {
        href: '/articles?category=books',
        label: 'Articles',
        icon: FileText,
        feature: 'articles',
      },
      { href: '/backlog?category=books', label: 'Book Library', icon: ListChecks },
      {
        href: '/review?category=books',
        label: 'Reviews',
        icon: Star,
        feature: 'reviews',
      },
    ],
  },
  {
    href: '/articles?category=coding',
    label: 'Coding',
    icon: Code,
    category: 'coding',
    children: [
      {
        href: '/articles?category=coding',
        label: 'Articles',
        icon: FileText,
        feature: 'articles',
      },
      { href: '/articles?category=coding&topic=tutorials', label: 'Tutorials', icon: BookOpen },
      {
        href: '/articles?category=coding&topic=weird-cases',
        label: 'Edge Cases',
        icon: Sparkles,
      },
    ],
  },
  {
    href: '/articles?category=pet',
    label: 'Pet',
    icon: PawPrint,
    category: 'pet',
    children: [
      {
        href: '/articles?category=pet',
        label: 'Articles',
        icon: FileText,
        feature: 'articles',
      },
      { href: '/articles?category=pet&topic=care', label: 'Care', icon: BookOpen },
      { href: '/articles?category=pet&topic=experiences', label: 'Stories', icon: Sparkles },
      {
        href: '/articles?category=pet&topic=health',
        label: 'Health',
        icon: Star,
        feature: 'reviews',
      },
    ],
  },
  {
    href: '/articles?category=vape',
    label: 'Vape',
    icon: Cloud,
    category: 'vape',
    children: [
      {
        href: '/articles?category=vape',
        label: 'Articles',
        icon: FileText,
        feature: 'articles',
      },
      {
        href: '/articles?category=vape&topic=devices',
        label: 'Devices & Atomizers',
        icon: ListChecks,
      },
      { href: '/articles?category=vape&topic=liquids', label: 'E-liquids', icon: BookOpen },
      { href: '/articles?category=vape&topic=experiences', label: 'Stories', icon: Sparkles },
      {
        href: '/review?category=vape',
        label: 'Reviews',
        icon: Star,
        feature: 'reviews',
      },
    ],
  },
];

export const normalizeHref = (href: string) => href.split('?')[0];

export const isHrefActive = (pathname: string, href: string) => {
  const targetPath = normalizeHref(href);
  if (targetPath === '/backlog') {
    return pathname.startsWith('/backlog');
  }
  return pathname.startsWith(targetPath);
};

export type NavbarFeatureFilters = {
  articles?: boolean;
  reviews?: boolean;
};

const featureEnabled = (feature: NavbarFeatureName | undefined, filters: NavbarFeatureFilters) => {
  if (!feature) {
    return true;
  }
  if (feature === 'articles') {
    return filters.articles ?? true;
  }
  if (feature === 'reviews') {
    return filters.reviews ?? true;
  }
  return true;
};

export const getVisibleNavItems = (
  isDev: boolean,
  isAuthenticated: boolean,
  authResolved: boolean,
  filters: NavbarFeatureFilters,
) =>
  NAV_ITEMS.filter(item => {
    if (item.devOnly && !isDev) {
      return false;
    }
    if (item.requiresAuth) {
      return authResolved && isAuthenticated;
    }
    if (!featureEnabled(item.feature, filters)) {
      return false;
    }
    return true;
  });

export const getVisibleHobbyItems = (
  items: HobbyItem[],
  authResolved: boolean,
  isAuthenticated: boolean,
  userCategories: string[],
  filters: NavbarFeatureFilters,
) => {
  if (!authResolved || !isAuthenticated) {
    return [];
  }

  const normalizedCategories = userCategories
    .map(category => category.trim().toLowerCase())
    .filter(Boolean);

  // Guard: authenticated users with no enabled categories should not see hobby/library items.
  if (normalizedCategories.length === 0) {
    return [];
  }

  return items
    .filter(item => !item.category || normalizedCategories.includes(item.category.toLowerCase()))
    .map(item => ({
      ...item,
      children: item.children
        ? item.children.filter(child => featureEnabled(child.feature, filters))
        : [],
    }));
};
