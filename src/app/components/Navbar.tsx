'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Search, Mail, Trophy, Star, Newspaper } from 'lucide-react';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  const navLinks = [
    { href: '/pages/guide', label: 'Guides', icon: <Book size={18} /> },
    { href: '/pages/reviews', label: 'Reviews', icon: <Star size={18} /> },
    { href: '/pages/news', label: 'News', icon: <Newspaper size={18} /> },
    { href: '/pages/contact', label: 'Contact', icon: <Mail size={18} /> },
    ...(isDev ? [{ href: '/pages/scraper', label: 'Scraper', icon: <Search size={18} /> }] : []),
  ];

  return (
    <header className="fixed left-0 top-0 z-50 w-full bg-gray-900/80 shadow-md backdrop-blur-lg">
      <nav className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-blue-400">
          <Trophy size={24} className="text-blue-400" />
          Platinum Hunters
        </Link>

        <ul className="hidden space-x-6 text-lg text-gray-300 md:flex">
          {navLinks.map(({ href, label, icon }) => (
            <li key={href}>
              <Link href={href} className="flex items-center gap-2 transition hover:text-blue-400">
                {icon} {label}
              </Link>
            </li>
          ))}
        </ul>

        <button className="text-2xl text-gray-300 md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.ul
              data-testid="mobile-menu"
              className="absolute left-0 top-16 flex w-full flex-col space-y-4 bg-gray-900/95 py-6 text-center text-lg text-gray-300"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
            >
              {navLinks.map(({ href, label, icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center justify-center gap-2 transition hover:text-blue-400"
                    onClick={() => setMenuOpen(false)}
                  >
                    {icon} {label}
                  </Link>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
