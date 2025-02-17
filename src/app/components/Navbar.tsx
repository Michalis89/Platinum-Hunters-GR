"use client";

import Link from "next/link";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { Book, Search, Mail, Trophy, Star, Newspaper } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isDev = process.env.NODE_ENV === "development"; // Ελέγχουμε αν είμαστε σε development

  const navLinks = [
    { href: "/pages/reviews", label: "Reviews", icon: <Star size={18} /> },
    { href: "/pages/news", label: "News", icon: <Newspaper size={18} /> },
    { href: "/pages/guide", label: "Guides", icon: <Book size={18} /> },
    { href: "/pages/contact", label: "Contact", icon: <Mail size={18} /> },
    ...(isDev ? [{ href: "/pages/scraper", label: "Scraper", icon: <Search size={18} /> }] : []), // Μόνο στο local
  ];

  return (
    <header className="fixed top-0 left-0 w-full bg-gray-900/80 backdrop-blur-lg shadow-md z-50">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-blue-400 flex items-center gap-2">
          <Trophy size={24} className="text-blue-400" />
          Platinum Hunters
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-6 text-lg text-gray-300">
          {navLinks.map(({ href, label, icon }) => (
            <li key={href}>
              <Link href={href} className="hover:text-blue-400 flex items-center gap-2 transition">
                {icon} {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-gray-300 text-2xl" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.ul
              className="absolute top-16 left-0 w-full bg-gray-900/95 flex flex-col text-center space-y-4 py-6 text-lg text-gray-300"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
            >
              {navLinks.map(({ href, label, icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="hover:text-blue-400 flex items-center justify-center gap-2 transition"
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
