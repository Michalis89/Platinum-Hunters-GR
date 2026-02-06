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
  { href: '/pages/news', label: 'Άρθρα', icon: FileText },
  { href: '/pages/reviews', label: 'Κριτικές', icon: Star },
  { href: '/pages/about', label: 'Σχετικά', icon: Book },
  { href: '/pages/support', label: 'Επικοινωνία', icon: MessageCircle, requiresAuth: true },
];

export const HOBBY_ITEMS: HobbyItem[] = [
  {
    href: '/pages/backlog?category=games',
    label: 'Games',
    icon: Gamepad2,
    category: 'games',
    children: [
      { href: '/pages/news?category=games', label: 'Άρθρα', icon: FileText },
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
      { href: '/pages/news?category=anime', label: 'Άρθρα', icon: FileText },
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
      { href: '/pages/news?category=manga', label: 'Άρθρα', icon: FileText },
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
      { href: '/pages/news?category=movies', label: 'Άρθρα', icon: FileText },
      { href: '/pages/backlog?category=movies', label: 'Movies Library', icon: ListChecks },
      { href: '/pages/reviews?category=movies', label: 'Reviews', icon: Star },
    ],
  },
  {
    href: '/pages/backlog?category=tv',
    label: 'TV Series',
    icon: Tv,
    category: 'tv',
    children: [
      { href: '/pages/news?category=tv', label: 'Άρθρα', icon: FileText },
      { href: '/pages/backlog?category=tv', label: 'TV Library', icon: ListChecks },
      { href: '/pages/reviews?category=tv', label: 'Reviews', icon: Star },
    ],
  },
  {
    href: '/pages/backlog?category=books',
    label: 'Βιβλία',
    icon: BookOpen,
    category: 'books',
    children: [
      { href: '/pages/news?category=books', label: 'Άρθρα', icon: FileText },
      { href: '/pages/backlog?category=books', label: 'Books Library', icon: ListChecks },
      { href: '/pages/reviews?category=books', label: 'Reviews', icon: Star },
    ],
  },
  {
    href: '/pages/news?category=coding',
    label: 'Coding',
    icon: Code,
    category: 'coding',
    children: [
      { href: '/pages/news?category=coding', label: 'Άρθρα', icon: FileText },
      { href: '/pages/news?category=coding&topic=tutorials', label: 'Tutorials', icon: BookOpen },
      { href: '/pages/news?category=coding&topic=weird-cases', label: 'Weird Cases', icon: Sparkles },
    ],
  },
  {
    href: '/pages/news?category=pet',
    label: 'Pet',
    icon: PawPrint,
    category: 'pet',
    children: [
      { href: '/pages/news?category=pet', label: 'Άρθρα', icon: FileText },
      { href: '/pages/news?category=pet&topic=care', label: 'Φροντίδα', icon: BookOpen },
      { href: '/pages/news?category=pet&topic=experiences', label: 'Εμπειρίες', icon: Sparkles },
      { href: '/pages/news?category=pet&topic=health', label: 'Υγεία', icon: Star },
    ],
  },
  {
    href: '/pages/news?category=vape',
    label: 'Vape',
    icon: Cloud,
    category: 'vape',
    children: [
      { href: '/pages/news?category=vape', label: 'Άρθρα', icon: FileText },
      {
        href: '/pages/news?category=vape&topic=devices',
        label: 'Ατμοποιητές/Συσκευές',
        icon: ListChecks,
      },
      { href: '/pages/news?category=vape&topic=liquids', label: 'Υγρά', icon: BookOpen },
      { href: '/pages/news?category=vape&topic=experiences', label: 'Εμπειρίες', icon: Sparkles },
      { href: '/pages/reviews?category=vape', label: 'Κριτικές', icon: Star },
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
  if (!authResolved) return items;
  if (isAuthenticated && userCategories.length > 0) {
    return items.filter(item => !item.category || userCategories.includes(item.category));
  }
  return items;
};
