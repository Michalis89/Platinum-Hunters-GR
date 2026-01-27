'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiMenu, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Book,
  Search,
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
  ChevronDown,
  ChevronRight,
  PenLine,
} from 'lucide-react';
import AddArticleDialog from './articles/AddArticleDialog';
import { usePathname } from 'next/navigation';
import { logout, selectIsAuthenticated, selectUser } from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';
import Button from './ui/Button';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  devOnly?: boolean;
  children?: NavItem[];
  category?: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/pages/about', label: 'Σχετικά', icon: <Book size={18} /> },
  { href: '/pages/scraper', label: 'Scraper', icon: <Search size={18} />, devOnly: true },
];

const HOBBY_ITEMS: NavItem[] = [
  {
    href: '/pages/backlog?category=gaming',
    label: 'Gaming',
    icon: <Gamepad2 size={18} />,
    category: 'gaming',
    children: [
      { href: '/pages/news?category=gaming', label: 'Άρθρα', icon: <FileText size={16} /> },
      {
        href: '/pages/backlog?category=gaming',
        label: 'Gaming Library',
        icon: <ListChecks size={16} />,
      },
      { href: '/pages/guides', label: 'Οδηγοί', icon: <Book size={16} /> },
      { href: '/pages/reviews?category=gaming', label: 'Reviews', icon: <Star size={16} /> },
    ],
  },
  {
    href: '/pages/backlog?category=anime',
    label: 'Anime',
    icon: <Sparkles size={18} />,
    category: 'anime',
    children: [
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
      {
        href: '/pages/backlog?category=manga',
        label: 'Manga Library',
        icon: <ListChecks size={16} />,
      },
      { href: '/pages/reviews?category=manga', label: 'Reviews', icon: <Star size={16} /> },
    ],
  },
  {
    href: '/pages/backlog?category=books',
    label: 'Βιβλία',
    icon: <BookOpen size={18} />,
    category: 'books',
    children: [
      {
        href: '/pages/backlog?category=books',
        label: 'Books Library',
        icon: <ListChecks size={16} />,
      },
      { href: '/pages/reviews?category=books', label: 'Reviews', icon: <Star size={16} /> },
    ],
  },
  {
    href: '/pages/backlog?category=movies',
    label: 'Movies',
    icon: <Film size={18} />,
    category: 'movies',
    children: [
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
      { href: '/pages/backlog?category=tv', label: 'TV Library', icon: <ListChecks size={16} /> },
      { href: '/pages/reviews?category=tv', label: 'Reviews', icon: <Star size={16} /> },
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
        label: 'Οδηγοί φροντίδας',
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
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const isDev = process.env.NODE_ENV === 'development';
  const pathname = usePathname();
  const canQuickAdd = !!user && (user.role === 'admin' || user.role === 'author');

  const handleLogout = async () => {
    await dispatch(logout());
    setMenuOpen(false);
  };

  const profileRef = useRef<HTMLDivElement>(null);

  const navLinks = NAV_ITEMS.filter(item => (item.devOnly ? isDev : true));
  const userCategories = (user?.categories as string[] | undefined) ?? [];
  const hobbyLinks =
    isAuthenticated && userCategories.length > 0
      ? HOBBY_ITEMS.filter(item => !item.category || userCategories.includes(item.category))
      : HOBBY_ITEMS;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  useEffect(() => {
    if (!profileOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileOpen]);

  const desktopLinkClass = (href: string) => {
    const base = 'flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium transition';
    const active =
      'border border-[var(--hb-border)] bg-white/5 text-[var(--hb-primary-strong)] shadow-[0_8px_30px_rgba(229,9,20,0.25)]';
    const inactive =
      'text-[var(--hb-muted)] hover:text-[var(--hb-primary-strong)] hover:bg-white/5';
    return `${base} ${isActive(href) ? active : inactive}`;
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--hb-border)] bg-[var(--hb-surface)] backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--hb-primary-strong)] shadow-[0_10px_35px_rgba(229,9,20,0.35)]">
            <span className="text-xl font-black leading-none text-slate-950 drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
              X
            </span>
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-[var(--hb-headline)]">
              Χομπίστας
            </span>
            <span className="text-[11px] text-[var(--hb-muted)]">Personal hobby hub</span>
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
                <span>Χόμπι</span>
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
          <div className="flex items-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1 shadow-[0_10px_30px_rgba(3,7,18,0.4)]">
            {canQuickAdd && (
              <Button
                onClick={() => setAddDialogOpen(true)}
                variant="primary"
                icon={<PenLine size={16} />}
                className="h-9 px-4"
              >
                Προσθήκη
              </Button>
            )}
            {isAuthenticated && user ? (
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
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-2 shadow-lg shadow-black/30">
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

                {/* Mobile Auth */}
                <div className="border-t border-[var(--hb-border)] pt-3">
                  {isAuthenticated && user ? (
                    <div className="flex flex-col gap-2">
                      {canQuickAdd && (
                        <Button
                          onClick={() => {
                            setMenuOpen(false);
                            setAddDialogOpen(true);
                          }}
                          variant="primary"
                          icon={<PenLine size={18} />}
                          className="justify-center"
                        >
                          Προσθήκη
                        </Button>
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

      {/* Add Article Dialog */}
      <AddArticleDialog
        isOpen={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={() => {
          // Optionally refresh or show notification
        }}
      />
    </header>
  );
}
