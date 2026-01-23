'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import VersionBadge from './components/ui/VersionBadge';
import { Book, ListChecks, Newspaper, LogIn, UserPlus, LogOut, User } from 'lucide-react';
import { ActivityFeed } from './components/activity/ActivityFeed';
import Button from './components/ui/Button';

import { useDispatch, useSelector } from 'react-redux';
import { logout, selectIsAuthenticated, selectUser, setUser } from '@/store/slices/authSlice';
import { AppDispatch } from '@/store/store';
import useSWR from 'swr';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Home() {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const { data: analytics } = useSWR('/api/analytics/summary', fetcher, {
    refreshInterval: 120000, // refresh every 2 minutes
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;
      fetch('/api/activity/heartbeat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (res.status === 401) {
            supabase.auth.getSession().then(({ data: refreshed }) => {
              if (!refreshed.session) {
                dispatch(setUser(null));
              }
            });
          }
        })
        .catch(() => {});
    });
  }, [isAuthenticated, dispatch]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--hb-bg)] text-[var(--hb-text)]">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 opacity-80 blur-[90px]">
        <div className="absolute inset-0 bg-[var(--hb-gradient)]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-12 px-4 pb-24 pt-20">
        {/* Hero */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr,0.7fr]">
          <motion.div
            className="rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-8 backdrop-blur"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--hb-muted)]">Χομπίστας</p>
            <h1 className="mt-2 bg-gradient-to-r from-[var(--hb-primary-strong)] via-[var(--hb-primary)] to-[var(--hb-accent)] bg-clip-text pb-2 text-4xl font-extrabold text-transparent md:text-5xl">
              Το προσωπικό σου hub για όλα τα χόμπι.
            </h1>
            <p className="text-[var(--hb-text)]/90 mt-4 max-w-2xl text-lg">
              Οργάνωσε gaming, anime, manga, βιβλία, σειρές και projects σε μία εφαρμογή — backlog,
              πρόοδος, σημειώσεις, στατιστικά.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <CTAButton href="/pages/backlog" icon={<ListChecks size={18} />} label="Backlog" />
              <CTAButton href="/pages/guides" icon={<Book size={18} />} label="Guides" primary />
              {isAuthenticated ? (
                <ProfileCTA username={user?.username ?? 'Προφίλ'} />
              ) : (
                <>
                  <Button href="/pages/auth/login" variant="outline" icon={<LogIn size={16} />}>
                    Σύνδεση
                  </Button>
                  <Button
                    href="/pages/auth/register"
                    variant="primary"
                    icon={<UserPlus size={16} />}
                  >
                    Εγγραφή
                  </Button>
                </>
              )}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Εγγεγραμμένοι"
                value={analytics?.total_users ?? '–'}
                accent="from-rose-500 to-red-400"
              />
              <MetricCard
                label="Ενεργοί τώρα"
                value={analytics?.active_users_now ?? '–'}
                accent="from-red-500 to-orange-400"
              />
              <MetricCard
                label="Οδηγοί"
                value={analytics?.total_guides ?? '–'}
                accent="from-amber-500 to-rose-400"
              />
              <MetricCard
                label="Παιχνίδια"
                value={analytics?.total_games ?? '–'}
                accent="from-orange-500 to-red-400"
              />
            </div>
          </motion.div>

          {/* Quick links */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <QuickCard
              title="Τελευταίοι Οδηγοί"
              desc="Δες τι προστέθηκε πρόσφατα."
              href="/pages/guides"
              icon={<Book size={18} />}
            />
            <QuickCard
              title="Backlog & Progress"
              desc="Οργάνωσε τι θες να δεις/παίξεις/διαβάσεις."
              href="/pages/backlog"
              icon={<ListChecks size={18} />}
            />
            <QuickCard
              title="Notes & Achievements"
              desc="Κατέγραψε προόδους και milestones."
              href="/pages/news"
              icon={<Newspaper size={18} />}
            />
          </motion.div>
        </div>

        {/* Activity + highlight */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr,0.7fr]">
          <ActivityFeed scope="global" limit={30} title="Τελευταίες ενέργειες" height={420} />
          <div className="space-y-4">
            <MiniCard title="Νέοι οδηγοί" desc="Δες τους πιο πρόσφατους οδηγούς." />
            <MiniCard title="Backlog tips" desc="Σύντομα tips & tricks για tracking." />
          </div>
        </div>
      </div>

      <VersionBadge />
    </div>
  );
}

function CTAButton({
  href,
  icon,
  label,
  primary,
}: Readonly<{ href: string; icon: React.ReactNode; label: string; primary?: boolean }>) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
        primary
          ? 'bg-gradient-to-r from-[var(--hb-primary-strong)] via-[var(--hb-primary)] to-[var(--hb-accent)] text-slate-950 hover:brightness-110'
          : 'hover:border-[var(--hb-primary-strong)]/60 border border-[var(--hb-border)] bg-[var(--hb-surface)] text-[var(--hb-text)] hover:text-[var(--hb-headline)]'
      }`}
    >
      <span className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </span>
    </Link>
  );
}

/* Small feature cards */
function MiniCard({ title, desc }: Readonly<{ title: string; desc: string }>) {
  return (
    <div className="hover:border-[var(--hb-primary-strong)]/50 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4 text-left transition hover:-translate-y-1">
      <h3 className="text-sm font-semibold text-[var(--hb-primary-strong)]">{title}</h3>
      <p className="mt-1 text-xs text-[var(--hb-muted)]">{desc}</p>
    </div>
  );
}

function QuickCard({
  title,
  desc,
  href,
  icon,
}: Readonly<{ title: string; desc: string; href: string; icon: React.ReactNode }>) {
  return (
    <Link
      href={href}
      className="hover:border-[var(--hb-primary-strong)]/60 flex items-center gap-3 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4 text-left transition hover:-translate-y-1"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-[var(--hb-primary-strong)]">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--hb-headline)]">{title}</p>
        <p className="text-xs text-[var(--hb-muted)]">{desc}</p>
      </div>
    </Link>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: Readonly<{ label: string; value: number | string; accent: string }>) {
  return (
    <div className="rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--hb-headline)]">{value}</p>
      <div className="mt-3 h-1.5 w-full rounded-full bg-white/5">
        <div className={`h-1.5 rounded-full bg-gradient-to-r ${accent}`} />
      </div>
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
    <div className="relative inline-flex items-center rounded-full border border-[var(--hb-border)] bg-[var(--hb-surface)] px-2 py-1">
      {/* Blue glow outline */}
      <motion.span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ boxShadow: '0 0 12px 3px rgba(239,68,68,0.35)' }}
        animate={{ opacity: [0.25, 0.55, 0.25], scale: [1, 1.03, 1] }}
        transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
      />

      {/* Profile Link (blue tone) */}
      <Link
        href="/pages/profile"
        className="bg-[var(--hb-primary-strong)]/20 hover:bg-[var(--hb-primary-strong)]/30 relative z-10 flex items-center gap-2 rounded-full px-4 py-1 text-[var(--hb-headline)] transition"
      >
        <User size={18} className="text-[var(--hb-primary-strong)]" />
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
