import {
  Book,
  BookOpen,
  Cloud,
  Code,
  Dice5,
  FileText,
  Film,
  Gamepad2,
  Home,
  ListChecks,
  MessageCircle,
  NotebookPen,
  PawPrint,
  Sparkles,
  Star,
  Tv,
  User,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export type NavbarFeatureName = 'articles' | 'reviews' | 'social_profile' | 'diary' | 'dnd';

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
  {
    href: '/explore',
    label: 'Explore',
    icon: Users,
    requiresAuth: true,
    feature: 'social_profile',
  },
  { href: '/about', label: 'About', icon: Book },
  {
    href: '/diary',
    label: 'Personal Diary',
    icon: NotebookPen,
    requiresAuth: true,
    feature: 'diary',
  },
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

export type DndToolItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  requiredRole?: 'dm' | 'player' | null; // null = visible to all
};

export const DND_TOOLS: DndToolItem[] = [
  { href: '/dnd/campaigns', label: 'My Campaigns', icon: Dice5, requiredRole: null },
  { href: '/dnd/dm', label: 'DM Dashboard', icon: Sparkles, requiredRole: 'dm' },
  { href: '/dnd/characters', label: 'My Characters', icon: User, requiredRole: 'player' },
  { href: '/dnd/tools', label: 'Shared Tools', icon: Wrench, requiredRole: 'player' },
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
  social_profile?: boolean;
  diary?: boolean;
  dnd?: boolean;
  dnd_role?: 'dm' | 'player' | null;
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
  if (feature === 'social_profile') {
    return filters.social_profile ?? false;
  }
  if (feature === 'diary') {
    return filters.diary ?? false;
  }
  if (feature === 'dnd') {
    return filters.dnd ?? false;
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
    if (!featureEnabled(item.feature, filters)) {
      return false;
    }
    if (item.requiresAuth) {
      return authResolved && isAuthenticated;
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

export const getVisibleDndTools = (tools: DndToolItem[], userRole: 'dm' | 'player' | null) => {
  return tools.filter(tool => {
    if (!tool.requiredRole) {
      return true; // Visible to all
    }
    return tool.requiredRole === userRole;
  });
};
