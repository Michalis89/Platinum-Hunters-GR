'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import VersionBadge from './components/ui/VersionBadge';
import { Book, ListChecks, Star, Newspaper, LogIn, UserPlus, LogOut, User } from 'lucide-react';

import { useDispatch, useSelector } from 'react-redux';
import { logout, selectIsAuthenticated, selectUser } from '@/store/slices/authSlice';
import { AppDispatch } from '@/store/store';

export default function Home() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 opacity-30 blur-3xl">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-blue-600/40" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-emerald-500/30" />
      </div>

      <motion.div
        className="relative z-10 max-w-4xl px-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        {/* Title */}
        <motion.h1 className="animate-gradient bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-300 bg-clip-text text-6xl font-extrabold text-transparent drop-shadow-lg">
          Platinum Hunters
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="mt-3 text-lg text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
        >
          Ελληνικό Gaming Hub — Οδηγοί, Backlog, Κριτικές & Νέα.
        </motion.p>

        {/* CTA-style category buttons */}
        <motion.div
          className="mt-8 flex flex-wrap justify-center gap-4 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
        >
          <CategoryCTA href="/pages/guides" icon={<Book size={18} />} label="Οδηγοί" />
          <CategoryCTA href="/pages/backlog" icon={<ListChecks size={18} />} label="Backlog" />
          <CategoryCTA href="/pages/reviews" icon={<Star size={18} />} label="Κριτικές" />
          <CategoryCTA href="/pages/news" icon={<Newspaper size={18} />} label="Νέα" />
        </motion.div>

        {/* Dynamic CTA based on authentication */}
        <motion.div
          className="mt-10 flex items-center justify-center gap-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          {isAuthenticated ? (
            <ProfileCTA username={user?.username ?? 'Προφίλ'} />
          ) : (
            <>
              <Link
                href="/pages/auth/login"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-800/70 px-6 py-3 text-base font-semibold text-gray-200 shadow-md transition hover:bg-slate-700"
              >
                <LogIn size={18} /> Σύνδεση
              </Link>
              <Link
                href="/pages/auth/register"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold shadow-lg transition hover:bg-blue-700"
              >
                <UserPlus size={18} /> Εγγραφή
              </Link>
            </>
          )}
        </motion.div>

        {/* Featured mini cards */}
        <motion.div
          className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 1 }}
        >
          <MiniCard title="Τελευταίοι Οδηγοί" desc="Δες τους πιο πρόσφατους οδηγούς." />
          <MiniCard title="Backlog Tracking" desc="Οργάνωσε τι θέλεις να παίξεις." />
          <MiniCard title="Κριτικές" desc="Γρήγορες και καθαρές γνώμες." />
        </motion.div>
      </motion.div>

      <VersionBadge />
    </div>
  );
}

/* CTA pill style */
function CategoryCTA({
  href,
  icon,
  label,
}: Readonly<{
  href: string;
  icon: React.ReactNode;
  label: string;
}>) {
  return (
    <Link
      href={href}
      className="relative flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-5 py-2 text-base font-medium text-gray-200 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-900"
    >
      {/* Glow outline */}
      <motion.span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          boxShadow: '0 0 8px 2px rgba(59,130,246,0.35)', // blue glow
        }}
        animate={{
          opacity: [0.2, 0.6, 0.2],
          scale: [1, 1.03, 1],
        }}
        transition={{
          duration: 3,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />

      {/* Actual content */}
      <span className="relative z-10 flex items-center gap-2">
        {icon}
        {label}
      </span>
    </Link>
  );
}

/* Small feature cards */
function MiniCard({ title, desc }: Readonly<{ title: string; desc: string }>) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-left shadow-md shadow-black/20 transition hover:-translate-y-1 hover:bg-slate-900">
      <h3 className="text-sm font-semibold text-blue-400">{title}</h3>
      <p className="mt-1 text-xs text-gray-300">{desc}</p>
    </div>
  );
}

function ProfileCTA({ username }: Readonly<{ username: string }>) {
  const dispatch = useDispatch<AppDispatch>();

  const handleLogoutClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    await dispatch(logout());
  };

  return (
    <div className="relative inline-flex items-center rounded-full border border-blue-500/40 bg-slate-900/80 px-2 py-1 shadow-sm">
      {/* Blue glow outline */}
      <motion.span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ boxShadow: '0 0 12px 3px rgba(59,130,246,0.35)' }}
        animate={{ opacity: [0.25, 0.55, 0.25], scale: [1, 1.03, 1] }}
        transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
      />

      {/* Profile Link (blue tone) */}
      <Link
        href="/pages/profile"
        className="relative z-10 flex items-center gap-2 rounded-full bg-blue-600/20 px-4 py-1 text-gray-100 transition hover:bg-blue-600/30"
      >
        <User size={18} className="text-blue-300" />
        <span className="font-medium">{username}</span>
      </Link>

      {/* Logout Button (red, compact) */}
      <button
        type="button"
        onClick={handleLogoutClick}
        className="relative z-10 ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600/70 text-white transition hover:bg-red-600"
        aria-label="Αποσύνδεση"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}
