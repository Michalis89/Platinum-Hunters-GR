import {
  Book,
  BookOpen,
  Cloud,
  Code,
  FileText,
  Film,
  Gamepad2,
  ListChecks,
  MessageCircle,
  PawPrint,
  Sparkles,
  Star,
  Tv,
  type LucideIcon,
} from 'lucide-react';

export type NavbarLinkItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  devOnly?: boolean;
  requiresAuth?: boolean;
};

export type HobbyChildItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type HobbyItem = NavbarLinkItem & {
  category?: string;
  children?: HobbyChildItem[];
};

export const NAV_ITEMS: NavbarLinkItem[] = [
  { href: '/pages/news', label: 'Articles', icon: FileText },
  { href: '/pages/reviews', label: 'Reviews', icon: Star },
  { href: '/pages/about', label: 'About', icon: Book },
  { href: '/pages/support', label: 'Support', icon: MessageCircle, requiresAuth: true },
];

export const HOBBY_ITEMS: HobbyItem[] = [
  {
    href: '/pages/backlog?category=games',
    label: 'Games',
    icon: Gamepad2,
    category: 'games',
    children: [
      { href: '/pages/news?category=games', label: 'Articles', icon: FileText },
      { href: '/pages/backlog?category=games', label: 'Gaming Backlog', icon: ListChecks },
      { href: '/pages/reviews?category=games', label: 'Reviews', icon: Star },
    ],
  },
  {
    href: '/pages/backlog?category=anime',
    label: 'Anime',
    icon: Sparkles,
    category: 'anime',
    children: [
      { href: '/pages/news?category=anime', label: 'Articles', icon: FileText },
      { href: '/pages/backlog?category=anime', label: 'Anime Library', icon: ListChecks },
      { href: '/pages/reviews?category=anime', label: 'Reviews', icon: Star },
    ],
  },
  {
    href: '/pages/backlog?category=manga',
    label: 'Manga',
    icon: BookOpen,
    category: 'manga',
    children: [
      { href: '/pages/news?category=manga', label: 'Articles', icon: FileText },
      { href: '/pages/backlog?category=manga', label: 'Manga Library', icon: ListChecks },
      { href: '/pages/reviews?category=manga', label: 'Reviews', icon: Star },
    ],
  },
  {
    href: '/pages/backlog?category=movies',
    label: 'Movies',
    icon: Film,
    category: 'movies',
    children: [
      { href: '/pages/news?category=movies', label: 'Articles', icon: FileText },
      { href: '/pages/backlog?category=movies', label: 'Movie Library', icon: ListChecks },
      { href: '/pages/reviews?category=movies', label: 'Reviews', icon: Star },
    ],
  },
  {
    href: '/pages/backlog?category=tv',
    label: 'TV Series',
    icon: Tv,
    category: 'tv',
    children: [
      { href: '/pages/news?category=tv', label: 'Articles', icon: FileText },
      { href: '/pages/backlog?category=tv', label: 'TV Library', icon: ListChecks },
      { href: '/pages/reviews?category=tv', label: 'Reviews', icon: Star },
    ],
  },
  {
    href: '/pages/backlog?category=books',
    label: 'Books',
    icon: BookOpen,
    category: 'books',
    children: [
      { href: '/pages/news?category=books', label: 'Articles', icon: FileText },
      { href: '/pages/backlog?category=books', label: 'Book Library', icon: ListChecks },
      { href: '/pages/reviews?category=books', label: 'Reviews', icon: Star },
    ],
  },
  {
    href: '/pages/news?category=coding',
    label: 'Coding',
    icon: Code,
    category: 'coding',
    children: [
      { href: '/pages/news?category=coding', label: 'Articles', icon: FileText },
      { href: '/pages/news?category=coding&topic=tutorials', label: 'Tutorials', icon: BookOpen },
      { href: '/pages/news?category=coding&topic=weird-cases', label: 'Edge Cases', icon: Sparkles },
    ],
  },
  {
    href: '/pages/news?category=pet',
    label: 'Pet',
    icon: PawPrint,
    category: 'pet',
    children: [
      { href: '/pages/news?category=pet', label: 'Articles', icon: FileText },
      { href: '/pages/news?category=pet&topic=care', label: 'Care', icon: BookOpen },
      { href: '/pages/news?category=pet&topic=experiences', label: 'Stories', icon: Sparkles },
      { href: '/pages/news?category=pet&topic=health', label: 'Health', icon: Star },
    ],
  },
  {
    href: '/pages/news?category=vape',
    label: 'Vape',
    icon: Cloud,
    category: 'vape',
    children: [
      { href: '/pages/news?category=vape', label: 'Articles', icon: FileText },
      {
        href: '/pages/news?category=vape&topic=devices',
        label: 'Devices & Atomizers',
        icon: ListChecks,
      },
      { href: '/pages/news?category=vape&topic=liquids', label: 'E-liquids', icon: BookOpen },
      { href: '/pages/news?category=vape&topic=experiences', label: 'Stories', icon: Sparkles },
      { href: '/pages/reviews?category=vape', label: 'Reviews', icon: Star },
    ],
  },
];

export const normalizeHref = (href: string) => href.split('?')[0];

export const isHrefActive = (pathname: string, href: string) => {
  const targetPath = normalizeHref(href);
  if (targetPath === '/pages/backlog') {
    return pathname.startsWith('/pages/backlog') || pathname === '/pages/hobbies';
  }
  return pathname.startsWith(targetPath);
};

export const getVisibleNavItems = (isDev: boolean, isAuthenticated: boolean, authResolved: boolean) =>
  NAV_ITEMS.filter(item => {
    if (item.devOnly && !isDev) return false;
    if (item.requiresAuth) return authResolved && isAuthenticated;
    return true;
  });

export const getVisibleHobbyItems = (
  items: HobbyItem[],
  authResolved: boolean,
  isAuthenticated: boolean,
  userCategories: string[],
) => {
  if (!authResolved || !isAuthenticated) return [];

  const normalizedCategories = userCategories.map(category => category.trim().toLowerCase()).filter(Boolean);

  // Guard: authenticated users with no enabled categories should not see hobby/library items.
  if (normalizedCategories.length === 0) return [];

  return items.filter(item => !item.category || normalizedCategories.includes(item.category.toLowerCase()));
};
