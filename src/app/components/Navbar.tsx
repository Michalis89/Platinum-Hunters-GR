'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState, MouseEvent, KeyboardEvent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiMenu, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Book,
  Star,
  User,
  LogIn,
  UserPlus,
  LogOut,
  ListChecks,
  Layers,
  Film,
  Tv,
  BookOpen,
  Gamepad2,
  Sparkles,
  Code,
  PawPrint,
  Cloud,
  FileText,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  PenLine,
  Plus,
  Sun,
  Moon,
  ShieldCheck,
  Ticket,
} from 'lucide-react';
import AddArticleDialog from './articles/AddArticleDialog';
import {
  logout,
  selectIsAuthenticated,
  selectIsLoading,
  selectUser,
  selectCanQuickAdd,
  selectCanAccessAdminPanel,
} from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';
import Button from './ui/Button';
import { useTheme } from '@/context/ThemeContext';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  devOnly?: boolean;
  children?: NavItem[];
  category?: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/pages/news', label: 'Άρθρα', icon: <FileText size={18} /> },
  { href: '/pages/reviews', label: 'Κριτικές', icon: <Star size={18} /> },
  { href: '/pages/about', label: 'Σχετικά', icon: <Book size={18} /> },
  { href: '/pages/support', label: 'Επικοινωνία', icon: <MessageCircle size={18} /> },
];

const HOBBY_ITEMS: NavItem[] = [
  {
    href: '/pages/backlog?category=games',
    label: 'Games',
    icon: <Gamepad2 size={18} />,
    category: 'games',
    children: [
      { href: '/pages/news?category=games', label: 'Άρθρα', icon: <FileText size={16} /> },
      {
        href: '/pages/backlog?category=games',
        label: 'Gaming Backlog',
        icon: <ListChecks size={16} />,
      },
      { href: '/pages/reviews?category=games', label: 'Reviews', icon: <Star size={16} /> },
    ],
  },
  {
    href: '/pages/backlog?category=anime',
    label: 'Anime',
    icon: <Sparkles size={18} />,
    category: 'anime',
    children: [
      { href: '/pages/news?category=anime', label: 'Άρθρα', icon: <FileText size={16} /> },
      {
        href: '/pages/backlog?category=anime',
        label: 'Anime Library',
        icon: <ListChecks size={16} />,
      },
      { href: '/pages/reviews?category=anime', label: 'Reviews', icon: <Star size={16} /> },
    ],
  },
  {
    href: '/pages/backlog?category=manga',
    label: 'Manga',
    icon: <BookOpen size={18} />,
    category: 'manga',
    children: [
      { href: '/pages/news?category=manga', label: 'Άρθρα', icon: <FileText size={16} /> },
      {
        href: '/pages/backlog?category=manga',
        label: 'Manga Library',
        icon: <ListChecks size={16} />,
      },
      { href: '/pages/reviews?category=manga', label: 'Reviews', icon: <Star size={16} /> },
    ],
  },
  {
    href: '/pages/backlog?category=movies',
    label: 'Movies',
    icon: <Film size={18} />,
    category: 'movies',
    children: [
      { href: '/pages/news?category=movies', label: 'Άρθρα', icon: <FileText size={16} /> },
      {
        href: '/pages/backlog?category=movies',
        label: 'Movies Library',
        icon: <ListChecks size={16} />,
      },
      { href: '/pages/reviews?category=movies', label: 'Reviews', icon: <Star size={16} /> },
    ],
  },
  {
    href: '/pages/backlog?category=tv',
    label: 'TV Series',
    icon: <Tv size={18} />,
    category: 'tv',
    children: [
      { href: '/pages/news?category=tv', label: 'Άρθρα', icon: <FileText size={16} /> },
      { href: '/pages/backlog?category=tv', label: 'TV Library', icon: <ListChecks size={16} /> },
      { href: '/pages/reviews?category=tv', label: 'Reviews', icon: <Star size={16} /> },
    ],
  },
  {
    href: '/pages/backlog?category=books',
    label: 'Βιβλία',
    icon: <BookOpen size={18} />,
    category: 'books',
    children: [
      { href: '/pages/news?category=books', label: 'Άρθρα', icon: <FileText size={16} /> },
      {
        href: '/pages/backlog?category=books',
        label: 'Books Library',
        icon: <ListChecks size={16} />,
      },
      { href: '/pages/reviews?category=books', label: 'Reviews', icon: <Star size={16} /> },
    ],
  },
  {
    href: '/pages/news?category=coding',
    label: 'Coding',
    icon: <Code size={18} />,
    category: 'coding',
    children: [
      {
        href: '/pages/news?category=coding',
        label: 'Άρθρα',
        icon: <FileText size={16} />,
      },
      {
        href: '/pages/news?category=coding&topic=tutorials',
        label: 'Tutorials',
        icon: <BookOpen size={16} />,
      },
      {
        href: '/pages/news?category=coding&topic=weird-cases',
        label: 'Weird Cases',
        icon: <Sparkles size={16} />,
      },
    ],
  },
  {
    href: '/pages/news?category=pet',
    label: 'Pet',
    icon: <PawPrint size={18} />,
    category: 'pet',
    children: [
      {
        href: '/pages/news?category=pet',
        label: 'Άρθρα',
        icon: <FileText size={16} />,
      },
      {
        href: '/pages/news?category=pet&topic=care',
        label: 'Φροντίδα',
        icon: <BookOpen size={16} />,
      },
      {
        href: '/pages/news?category=pet&topic=experiences',
        label: 'Εμπειρίες',
        icon: <Sparkles size={16} />,
      },
      { href: '/pages/news?category=pet&topic=health', label: 'Υγεία', icon: <Star size={16} /> },
    ],
  },
  {
    href: '/pages/news?category=vape',
    label: 'Vape',
    icon: <Cloud size={18} />,
    category: 'vape',
    children: [
      {
        href: '/pages/news?category=vape',
        label: 'Άρθρα',
        icon: <FileText size={16} />,
      },
      {
        href: '/pages/news?category=vape&topic=devices',
        label: 'Ατμοποιητές/Συσκευές',
        icon: <ListChecks size={16} />,
      },
      {
        href: '/pages/news?category=vape&topic=liquids',
        label: 'Υγρά',
        icon: <BookOpen size={16} />,
      },
      {
        href: '/pages/news?category=vape&topic=experiences',
        label: 'Εμπειρίες',
        icon: <Sparkles size={16} />,
      },
      { href: '/pages/reviews?category=vape', label: 'Κριτικές', icon: <Star size={16} /> },
    ],
  },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hobbiesOpen, setHobbiesOpen] = useState(false);
  const [hoveredHobby, setHoveredHobby] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAuthLoading = useSelector(selectIsLoading);
  const user = useSelector(selectUser);
  const isDev = process.env.NODE_ENV === 'development';
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const canQuickAdd = useSelector(selectCanQuickAdd);
  const canAccessAdminPanel = useSelector(selectCanAccessAdminPanel);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setHobbiesOpen(false);
    setProfileOpen(false);
    setHoveredHobby(null);
  }, [pathname]);

  const authResolved = hasMounted && !isAuthLoading && (isAuthenticated ? Boolean(user) : true);
  const logoHref = authResolved && isAuthenticated ? '/dashboard' : '/home';

  const handleLogout = async () => {
    await dispatch(logout());
    setMenuOpen(false);
  };

  const profileRef = useRef<HTMLDivElement>(null);

  const navLinks = NAV_ITEMS.filter(item => (item.devOnly ? isDev : true));
  const userCategories = (user?.categories as string[] | undefined) ?? [];
  const hobbyLinks = !authResolved
    ? HOBBY_ITEMS
    : isAuthenticated && userCategories.length > 0
      ? HOBBY_ITEMS.filter(item => !item.category || userCategories.includes(item.category))
      : HOBBY_ITEMS;

  const normalizeHref = (href: string) => href.split('?')[0];
  const isActive = (href: string) => {
    if (!pathname) return false;
    const path = normalizeHref(href);
    if (path === '/pages/backlog') {
      return pathname?.startsWith('/pages/backlog') || pathname === '/pages/hobbies';
    }
    return pathname.startsWith(path);
  };

  const handleGoToHobbies = () => {
    setHobbiesOpen(false);
    router.push('/pages/hobbies');
  };

  const handleHobbyLabelClick = (event: MouseEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    handleGoToHobbies();
  };

  const handleHobbyLabelKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      handleGoToHobbies();
    }
  };

  useEffect(() => {
    if (!profileOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [profileOpen]);

  const desktopLinkClass = (href: string) => {
    const base = 'flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium transition';
    const active =
      'border border-[var(--hb-border)] bg-white/5 text-[var(--hb-primary-strong)] shadow-[var(--hb-shadow-md)]';
    const inactive =
      'text-[var(--hb-muted)] hover:text-[var(--hb-primary-strong)] hover:bg-white/5';
    return `${base} ${isActive(href) ? active : inactive}`;
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--hb-border)] bg-[var(--hb-surface)] backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo */}
        <Link href={logoHref} className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--hb-primary-strong)] shadow-[var(--hb-shadow-md)]">
            <span className="text-xl font-black leading-none text-slate-950 drop-shadow-[var(--hb-shadow-md)]">
              Η
            </span>
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-[var(--hb-headline)]">
              Hobbistas
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-6 md:flex">
          <ul className="flex items-center gap-2">
            <li className="relative">
              <button
                onMouseEnter={() => setHobbiesOpen(true)}
                onMouseLeave={() => setHobbiesOpen(false)}
                onClick={() => setHobbiesOpen(open => !open)}
                className={desktopLinkClass('/pages/backlog?category')}
              >
                <Layers size={18} />
                <span
                  role="link"
                  tabIndex={0}
                  className="cursor-pointer"
                  onClick={handleHobbyLabelClick}
                  onKeyDown={handleHobbyLabelKeyDown}
                >
                  Χόμπι
                </span>
                <ChevronDown size={14} />
              </button>
              <AnimatePresence>
                {hobbiesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.12 }}
                    onMouseEnter={() => setHobbiesOpen(true)}
                    onMouseLeave={() => {
                      setHobbiesOpen(false);
                      setHoveredHobby(null);
                    }}
                    className="absolute left-0 top-full mt-2 min-w-[260px] rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-surface)] p-2 shadow-lg shadow-black/40"
                  >
                    <div className="relative">
                      <ul className="flex flex-col gap-1">
                        {hobbyLinks.map(({ href, label, icon, children }) => (
                          <li
                            key={href}
                            className={`relative rounded-xl transition ${hoveredHobby === label ? 'bg-white/5 text-[var(--hb-primary-strong)]' : ''}`}
                            onMouseEnter={() => setHoveredHobby(label)}
                          >
                            <Link
                              href={href}
                              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--hb-muted)] transition hover:bg-white/5 hover:text-[var(--hb-primary-strong)]"
                              onClick={() => {
                                if (!children) {
                                  setHobbiesOpen(false);
                                  setHoveredHobby(null);
                                } else {
                                  setHoveredHobby(label);
                                }
                              }}
                            >
                              {icon}
                              <span>{label}</span>
                              {children ? <ChevronRight size={14} className="ml-auto" /> : null}
                            </Link>

                            {children && hoveredHobby === label && (
                              <div className="absolute left-[102%] top-0 min-w-[220px] rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-surface)] p-2 shadow-lg shadow-black/40">
                                <ul className="flex flex-col gap-1">
                                  {children.map(child => (
                                    <li key={child.href}>
                                      <Link
                                        href={child.href}
                                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--hb-muted)] transition hover:bg-white/5 hover:text-[var(--hb-primary-strong)]"
                                        onClick={() => {
                                          setHobbiesOpen(false);
                                          setHoveredHobby(null);
                                        }}
                                      >
                                        {child.icon}
                                        <span>{child.label}</span>
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
            {navLinks.map(({ href, label, icon }) => (
              <li key={href}>
                <Link href={href} className={desktopLinkClass(href)}>
                  {icon}
                  <span>{label}</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Auth Links */}
          <div className="flex items-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1">
            {!hasMounted || !authResolved ? (
              <NavbarAuthSkeleton />
            ) : isAuthenticated && user ? (
              <>
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileOpen(open => !open)}
                    className="flex items-center gap-2 rounded-full px-3 py-1 text-sm text-[var(--hb-text)] transition hover:bg-white/5 hover:text-[var(--hb-primary-strong)]"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-[var(--hb-headline)]">
                      {user.avatar_url ? (
                        <span
                          className="h-8 w-8 rounded-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${user.avatar_url})` }}
                        />
                      ) : (
                        <User size={16} />
                      )}
                    </span>
                    <span className="max-w-[120px] truncate">{user.username}</span>
                    <ChevronDown size={14} />
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-2 shadow-lg shadow-black/20">
                      {canQuickAdd && (
                        <button
                          onClick={() => {
                            setAddDialogOpen(true);
                            setProfileOpen(false);
                          }}
                          className="hover:bg-[var(--hb-accent)]/10 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--hb-text)] transition hover:text-[var(--hb-accent)]"
                          aria-label="Προσθήκη άρθρου"
                        >
                          <Plus size={16} />
                          <span>Προσθήκη</span>
                        </button>
                      )}
                      <Link
                        href="/pages/profile"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--hb-text)] transition hover:bg-white/5 hover:text-[var(--hb-primary-strong)]"
                        onClick={() => setProfileOpen(false)}
                      >
                        <User size={16} />
                        <span>Προφίλ</span>
                      </Link>
                      <Link
                        href="/pages/profile/edit"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--hb-text)] transition hover:bg-white/5 hover:text-[var(--hb-primary-strong)]"
                        onClick={() => setProfileOpen(false)}
                      >
                        <PenLine size={16} />
                        <span>Επεξεργασία Προφίλ</span>
                      </Link>
                      <Link
                        href="/pages/support/tickets"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--hb-text)] transition hover:bg-white/5 hover:text-[var(--hb-primary-strong)]"
                        onClick={() => setProfileOpen(false)}
                      >
                        <Ticket size={16} />
                        <span>Τα tickets μου</span>
                      </Link>
                      {canAccessAdminPanel && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--hb-text)] transition hover:bg-white/5 hover:text-[var(--hb-primary-strong)]"
                          onClick={() => setProfileOpen(false)}
                        >
                          <ShieldCheck size={16} />
                          <span>Admin Panel</span>
                        </Link>
                      )}

                      <button
                        onClick={toggleTheme}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[var(--hb-text)] transition hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--hb-border)] bg-[var(--hb-panel)]">
                          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </span>

                        <div className="flex flex-col text-left leading-tight">
                          <span>Θέμα</span>
                          <span
                            suppressHydrationWarning
                            className="text-[11px] text-[var(--hb-muted)]"
                          >
                            {theme === 'dark' ? 'Ενεργό: Dark' : 'Ενεργό: Light'}
                          </span>
                        </div>
                      </button>

                      <div className="my-1 border-t border-[var(--hb-border)]" />
                      <button
                        onClick={() => {
                          handleLogout();
                          setProfileOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--hb-text)] transition hover:bg-white/5 hover:text-[var(--hb-primary-strong)]"
                      >
                        <LogOut size={16} />
                        <span>Έξοδος</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={toggleTheme}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--hb-muted)] transition hover:bg-white/5 hover:text-[var(--hb-primary-strong)]"
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <Button
                  href="/pages/auth/login"
                  variant="outline"
                  icon={<LogIn size={18} />}
                  className="h-9 px-3"
                >
                  Σύνδεση
                </Button>
                <Button
                  href="/pages/auth/register"
                  variant="primary"
                  icon={<UserPlus size={18} />}
                  className="h-9 px-3"
                >
                  Εγγραφή
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile toggle */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] text-xl text-[var(--hb-text)] shadow-sm shadow-black/40 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              data-testid="mobile-menu"
              className="absolute inset-x-0 top-full mt-0 max-h-[80vh] w-full overflow-y-auto border-b border-[var(--hb-border)] bg-[var(--hb-bg)] pb-6 pt-4 md:hidden"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
            >
              <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4">
                {/* Hobbies - Horizontal scroll */}
                <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--hb-headline)]">
                    <Layers size={16} />
                    <span>Χόμπι</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {hobbyLinks.map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="hover:border-[var(--hb-primary-strong)]/50 flex shrink-0 items-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 py-2 text-sm text-[var(--hb-text)] transition hover:text-[var(--hb-primary-strong)]"
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Quick Links */}
                <div className="flex flex-wrap gap-2">
                  {navLinks.map(({ href, label, icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="hover:border-[var(--hb-primary-strong)]/50 flex items-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 py-2 text-sm text-[var(--hb-text)] transition hover:text-[var(--hb-primary-strong)]"
                      onClick={() => setMenuOpen(false)}
                    >
                      {icon}
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>

                {/* Mobile Theme Toggle */}
                <div className="border-t border-[var(--hb-border)] pt-3">
                  <button
                    onClick={toggleTheme}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 py-2 text-sm text-[var(--hb-text)] transition hover:text-[var(--hb-primary-strong)]"
                  >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    <span suppressHydrationWarning>
                      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </span>
                  </button>
                </div>

                {/* Mobile Auth */}
                <div className="border-t border-[var(--hb-border)] pt-3">
                  {!hasMounted || !authResolved ? (
                    <NavbarAuthSkeletonMobile />
                  ) : isAuthenticated && user ? (
                    <div className="flex flex-col gap-2">
                      {canQuickAdd && (
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            setAddDialogOpen(true);
                          }}
                          className="hover:bg-[var(--hb-accent)]/10 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 py-2 text-sm font-semibold text-[var(--hb-text)] transition hover:text-[var(--hb-accent)]"
                        >
                          <Plus size={16} />
                          <span>Προσθήκη</span>
                        </button>
                      )}
                      <div className="flex gap-2">
                        <Link
                          href="/pages/profile"
                          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 py-2 text-sm text-[var(--hb-text)] transition hover:text-[var(--hb-primary-strong)]"
                          onClick={() => setMenuOpen(false)}
                        >
                          <User size={18} />
                          <span className="truncate">{user.username}</span>
                        </Link>
                        <Button
                          onClick={handleLogout}
                          variant="outline"
                          icon={<LogOut size={18} />}
                          iconOnly
                          ariaLabel="Αποσύνδεση"
                          className="h-10 w-10 shrink-0"
                        />
                      </div>
                      <Link
                        href="/pages/support/tickets"
                        className="flex items-center justify-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 py-2 text-sm text-[var(--hb-text)] transition hover:text-[var(--hb-primary-strong)]"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Ticket size={18} />
                        <span>Τα tickets μου</span>
                      </Link>
                      {canAccessAdminPanel && (
                        <Link
                          href="/admin"
                          className="flex items-center justify-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 py-2 text-sm text-[var(--hb-text)] transition hover:text-[var(--hb-primary-strong)]"
                          onClick={() => setMenuOpen(false)}
                        >
                          <ShieldCheck size={18} />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        href="/pages/auth/login"
                        variant="outline"
                        icon={<LogIn size={18} />}
                        className="flex-1 justify-center"
                        onClick={() => setMenuOpen(false)}
                      >
                        Σύνδεση
                      </Button>
                      <Button
                        href="/pages/auth/register"
                        variant="primary"
                        icon={<UserPlus size={18} />}
                        className="flex-1 justify-center"
                        onClick={() => setMenuOpen(false)}
                      >
                        Εγγραφή
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AddArticleDialog
        isOpen={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={() => {}}
      />
    </header>
  );
}

function NavbarAuthSkeleton() {
  return (
    <div className="flex items-center gap-2 px-3 py-1">
      <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
      <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
      <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
    </div>
  );
}

function NavbarAuthSkeletonMobile() {
  return (
    <div className="flex items-center justify-center gap-2 py-2">
      <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
      <div className="h-16 animate-pulse rounded bg-white/10" />
    </div>
  );
}
