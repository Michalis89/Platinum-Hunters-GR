'use client';

/**
 * Backlog Stats Component
 * PH-31: User Backlog System
 */

import { Trophy, Clock, Gamepad2, Signal, TrendingUp } from 'lucide-react';

interface BacklogStatsProps {
  readonly stats: {
    readonly totalGames: number;
    readonly totalHours: number;
    readonly totalPlayedHours: number;
    readonly trophiesRemaining: {
      readonly platinum: number;
      readonly gold: number;
      readonly silver: number;
      readonly bronze: number;
      readonly total: number;
    };
    readonly trophiesEarned: {
      readonly platinum: number;
      readonly gold: number;
      readonly silver: number;
      readonly bronze: number;
      readonly total: number;
    };
    readonly platformBreakdown: Readonly<Record<string, number>>;
    readonly difficultyAverage: number;
    readonly recentlyAdded: readonly unknown[];
  };
}

export default function BacklogStats({ stats }: BacklogStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Games */}
      <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <Gamepad2 className="h-5 w-5 text-blue-400" />
          </div>
          <TrendingUp className="h-4 w-4 text-slate-600 transition-colors group-hover:text-blue-500" />
        </div>
        <div className="mb-1 text-3xl font-bold text-slate-100">{stats.totalGames}</div>
        <div className="text-sm text-slate-400">Παιχνίδια στο Backlog</div>
      </div>

      {/* Hours (remaining vs played) */}
      <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
            <Clock className="h-5 w-5 text-purple-400" />
          </div>
          <TrendingUp className="h-4 w-4 text-slate-600 transition-colors group-hover:text-purple-500" />
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Υπόλοιπο</p>
            <div className="text-2xl font-bold text-slate-100">{Math.round(stats.totalHours)}h</div>
            {stats.totalHours >= 100 && (
              <div className="text-xs text-purple-400">
                ~{Math.round(stats.totalHours / 24)} ημέρες gameplay
              </div>
            )}
          </div>
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-emerald-200/80">Έχεις παίξει</p>
            <div className="text-lg font-semibold text-emerald-200">
              {Math.round(stats.totalPlayedHours)}h
            </div>
            {stats.totalPlayedHours >= 100 && (
              <div className="text-[11px] text-emerald-300/90">
                ~{Math.round(stats.totalPlayedHours / 24)} ημέρες στο χειριστήριο
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trophies (earned vs remaining) */}
      <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-blue-300/50 hover:shadow-lg hover:shadow-blue-300/10">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
            <Trophy className="h-5 w-5 text-blue-300" />
          </div>
          <TrendingUp className="h-4 w-4 text-slate-600 transition-colors group-hover:text-blue-300" />
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Πλατίνες</p>
            <div className="flex items-center gap-1 text-2xl font-bold text-slate-100">
              {stats.trophiesEarned.total}
              <Trophy size={20} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-1 text-blue-200 ring-2 ring-blue-500/30">
                {stats.trophiesEarned.platinum} <Trophy size={14} />
              </span>
              <span className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-1 text-yellow-200 ring-1 ring-yellow-500/30">
                {stats.trophiesEarned.gold} <Trophy size={14} />
              </span>
              <span className="flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-1 text-slate-200 ring-1 ring-slate-500/30">
                {stats.trophiesEarned.silver} <Trophy size={14} />
              </span>
              <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-amber-100 ring-1 ring-amber-500/30">
                {stats.trophiesEarned.bronze} <Trophy size={14} />
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-blue-400/40 bg-blue-500/5 px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-blue-200/80">
              Σου λείπουν (ενεργό backlog)
            </p>
            <div className="flex items-center gap-1 text-lg font-semibold text-blue-100">
              {stats.trophiesRemaining.total} <Trophy size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Average Difficulty */}
      <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <Signal className="h-5 w-5 text-emerald-400" />
          </div>
          <TrendingUp className="h-4 w-4 text-slate-600 transition-colors group-hover:text-emerald-500" />
        </div>
        <div className="mb-1 text-3xl font-bold text-slate-100">
          {stats.difficultyAverage.toFixed(1)}/10
        </div>
        <div className="text-sm text-slate-400">Μέση Δυσκολία (ενεργά)</div>
        <div className="mt-2 text-xs text-slate-500">
          {stats.difficultyAverage < 4 && 'Εύκολο Backlog 🟢'}
          {stats.difficultyAverage >= 4 && stats.difficultyAverage < 7 && 'Μέτριο Backlog 🟡'}
          {stats.difficultyAverage >= 7 && 'Δύσκολο Backlog 🔴'}
        </div>
      </div>
    </div>
  );
}
