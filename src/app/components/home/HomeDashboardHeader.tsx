'use client';

import Link from 'next/link';
import { User, LogOut, Settings } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';

type HomeDashboardHeaderProps = {
  username: string;
  displayName?: string | null;
};

export function HomeDashboardHeader({
  username,
  displayName,
}: HomeDashboardHeaderProps) {
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = async () => {
    await dispatch(logout());
  };

  const greeting = getGreeting();
  const name = displayName || username;

  return (
    <section className="px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-sm text-[var(--hb-muted)]">{greeting}</p>
            <h1 className="text-2xl font-bold text-[var(--hb-headline)] md:text-3xl">
              Καλωσόρισες,{' '}
              <span className="bg-gradient-to-r from-[var(--hb-primary-strong)] to-[var(--hb-accent)] bg-clip-text text-transparent">
                {name}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/pages/profile"
              className="flex items-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-4 py-2 text-sm font-medium text-[var(--hb-text)] transition hover:border-[var(--hb-primary-strong)]/50 hover:text-[var(--hb-headline)]"
            >
              <User className="h-4 w-4" />
              Προφίλ
            </Link>

            <Link
              href="/pages/profile/edit"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] text-[var(--hb-muted)] transition hover:border-[var(--hb-primary-strong)]/50 hover:text-[var(--hb-headline)]"
              title="Ρυθμίσεις"
            >
              <Settings className="h-4 w-4" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/20 text-red-400 transition hover:bg-red-600/30"
              title="Αποσύνδεση"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Καλημέρα';
  if (hour >= 12 && hour < 17) return 'Καλό μεσημέρι';
  if (hour >= 17 && hour < 21) return 'Καλό απόγευμα';
  return 'Καλό βράδυ';
}
