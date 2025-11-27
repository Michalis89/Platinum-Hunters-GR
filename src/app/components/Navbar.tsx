'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiMenu, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Book,
  Search,
  Mail,
  Trophy,
  Star,
  Newspaper,
  User,
  LogIn,
  UserPlus,
  LogOut,
  ListChecks,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { logout, selectIsAuthenticated, selectUser } from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const isDev = process.env.NODE_ENV === 'development';
  const pathname = usePathname();

  const handleLogout = async () => {
    await dispatch(logout());
    setMenuOpen(false);
  };

  const navLinks = [
    { href: '/pages/guides', label: 'Οδηγοί', icon: <Book size={18} /> },
    { href: '/pages/backlog', label: 'Backlog', icon: <ListChecks size={18} /> }, // νέο link
    { href: '/pages/reviews', label: 'Κριτικές', icon: <Star size={18} /> },
    { href: '/pages/news', label: 'Νέα', icon: <Newspaper size={18} /> },
    { href: '/pages/contact', label: 'Επικοινωνία', icon: <Mail size={18} /> },
    ...(isDev ? [{ href: '/pages/scraper', label: 'Scraper', icon: <Search size={18} /> }] : []),
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  const desktopLinkClass = (href: string) => {
    const base = 'flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium transition';
    const active = 'bg-slate-800/80 text-blue-400 shadow-sm shadow-blue-500/30';
    const inactive = 'text-gray-300 hover:text-blue-400 hover:bg-slate-800/40';
    return `${base} ${isActive(href) ? active : inactive}`;
  };

  const mobileLinkClass = (href: string) => {
    const base =
      'flex items-center justify-center gap-2 rounded-full px-4 py-2 text-base font-medium transition';
    const active = 'bg-slate-800 text-blue-400 shadow-sm shadow-blue-500/30';
    const inactive = 'text-gray-200 hover:text-blue-400 hover:bg-slate-800/60';
    return `${base} ${isActive(href) ? active : inactive}`;
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 via-sky-400 to-emerald-400 shadow-md shadow-blue-500/40">
            <Trophy size={18} className="text-slate-950" />
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-slate-50">
              Platinum Hunters
            </span>
            <span className="text-[11px] text-slate-400">Ελληνικό Gaming Hub</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-6 md:flex">
          <ul className="flex items-center gap-2">
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
          <div className="flex items-center gap-4 rounded-full border border-slate-800/90 bg-slate-950/60 px-4 py-1.5">
            {isAuthenticated && user ? (
              <>
                <Link
                  href="/pages/profile"
                  className="flex items-center gap-2 text-sm text-gray-200 transition hover:text-blue-400"
                >
                  <User size={18} />
                  <span className="max-w-[140px] truncate">{user.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm text-slate-300 transition hover:text-red-400"
                >
                  <LogOut size={16} />
                  <span>Έξοδος</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/pages/auth/login"
                  className="flex items-center gap-2 text-sm text-slate-200 transition hover:text-blue-400"
                >
                  <LogIn size={18} />
                  <span>Σύνδεση</span>
                </Link>
                <Link
                  href="/pages/auth/register"
                  className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow-md shadow-blue-500/40 transition hover:bg-blue-500"
                >
                  <UserPlus size={18} />
                  <span>Εγγραφή</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile toggle */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800/80 bg-slate-900/80 text-xl text-gray-200 shadow-sm shadow-black/40 md:hidden"
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
              className="absolute inset-x-0 top-full mt-2 w-full border-b border-t border-slate-800/80 bg-slate-950 pb-6 pt-4 md:hidden"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
            >
              <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4">
                <ul className="flex flex-col gap-3">
                  {navLinks.map(({ href, label, icon }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className={mobileLinkClass(href)}
                        onClick={() => setMenuOpen(false)}
                      >
                        {icon}
                        <span>{label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Mobile Auth */}
                <div className="mt-3 border-t border-slate-800/80 pt-4">
                  {isAuthenticated && user ? (
                    <div className="flex flex-col gap-3">
                      <Link
                        href="/pages/profile"
                        className={mobileLinkClass('/pages/profile')}
                        onClick={() => setMenuOpen(false)}
                      >
                        <User size={18} />
                        <span>{user.username}</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 rounded-full px-4 py-2 text-base font-medium text-red-300 hover:bg-red-950/40 hover:text-red-200"
                      >
                        <LogOut size={18} />
                        <span>Έξοδος</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Link
                        href="/pages/auth/login"
                        className={mobileLinkClass('/pages/auth/login')}
                        onClick={() => setMenuOpen(false)}
                      >
                        <LogIn size={18} />
                        <span>Σύνδεση</span>
                      </Link>
                      <Link
                        href="/pages/auth/register"
                        className="flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-md shadow-blue-500/40 transition hover:bg-blue-500"
                        onClick={() => setMenuOpen(false)}
                      >
                        <UserPlus size={18} />
                        <span>Εγγραφή</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
