'use client';

/**
 * Backlog Stats Component
 * PH-31: User Backlog System
 */

import { Trophy, Clock, Gamepad2, Signal, TrendingUp } from 'lucide-react';

interface BacklogStatsProps {
  stats: {
    totalGames: number;
    totalHours: number;
    totalTrophies: {
      platinum: number;
      gold: number;
      silver: number;
      bronze: number;
      total: number;
    };
    platformBreakdown: Record<string, number>;
    difficultyAverage: number;
    recentlyAdded: unknown[];
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

      {/* Total Hours */}
      <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
            <Clock className="h-5 w-5 text-purple-400" />
          </div>
          <TrendingUp className="h-4 w-4 text-slate-600 transition-colors group-hover:text-purple-500" />
        </div>
        <div className="mb-1 text-3xl font-bold text-slate-100">
          {Math.round(stats.totalHours)}h
        </div>
        <div className="text-sm text-slate-400">Εκτιμώμενες Ώρες</div>
        {stats.totalHours >= 100 && (
          <div className="mt-2 text-xs text-purple-400">
            ~{Math.round(stats.totalHours / 24)} ημέρες gameplay
          </div>
        )}
      </div>

      {/* Total Trophies */}
      <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/10">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
            <Trophy className="h-5 w-5 text-yellow-400" />
          </div>
          <TrendingUp className="h-4 w-4 text-slate-600 transition-colors group-hover:text-yellow-500" />
        </div>
        <div className="mb-1 text-3xl font-bold text-slate-100">{stats.totalTrophies.total}</div>
        <div className="text-sm text-slate-400">Συνολικά Trophies</div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1">
            <span className="font-semibold text-yellow-400">{stats.totalTrophies.platinum}</span>
            <Trophy size={12} className="text-yellow-400" />
          </span>
          <span className="flex items-center gap-1">
            <span className="font-semibold text-yellow-600">{stats.totalTrophies.gold}</span>
            <Trophy size={12} className="text-yellow-600" />
          </span>
          <span className="flex items-center gap-1">
            <span className="font-semibold text-slate-400">{stats.totalTrophies.silver}</span>
            <Trophy size={12} className="text-slate-400" />
          </span>
          <span className="flex items-center gap-1">
            <span className="font-semibold text-amber-700">{stats.totalTrophies.bronze}</span>
            <Trophy size={12} className="text-amber-700" />
          </span>
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
        <div className="text-sm text-slate-400">Μέση Δυσκολία</div>
        <div className="mt-2 text-xs text-slate-500">
          {stats.difficultyAverage < 4 && 'Εύκολο Backlog 🟢'}
          {stats.difficultyAverage >= 4 && stats.difficultyAverage < 7 && 'Μέτριο Backlog 🟡'}
          {stats.difficultyAverage >= 7 && 'Δύσκολο Backlog 🔴'}
        </div>
      </div>
    </div>
  );
}
