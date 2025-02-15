"use client";

import Link from "next/link";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full bg-gray-900/80 backdrop-blur-lg shadow-md z-50">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-blue-400 flex items-center gap-2">
          🎮 Platinum Hunters
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-6 text-lg text-gray-300">
          <li>
            <Link href="/guide" className="hover:text-blue-400 transition">
              📜 Guides
            </Link>
          </li>
          <li>
            <Link href="/contact" className="hover:text-blue-400 transition">
              📧 Contact
            </Link>
          </li>
        </ul>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-gray-300 text-2xl" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>

        {/* Mobile Menu */}
        {menuOpen && (
          <ul className="absolute top-16 left-0 w-full bg-gray-900/95 flex flex-col text-center space-y-4 py-6 text-lg text-gray-300">
            <li>
              <Link
                href="/"
                className="hover:text-blue-400 transition"
                onClick={() => setMenuOpen(false)}
              >
                🏠 Home
              </Link>
            </li>
            <li>
              <Link
                href="/guides"
                className="hover:text-blue-400 transition"
                onClick={() => setMenuOpen(false)}
              >
                📜 Guides
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="hover:text-blue-400 transition"
                onClick={() => setMenuOpen(false)}
              >
                📧 Contact
              </Link>
            </li>
          </ul>
        )}
      </nav>
    </header>
  );
}
