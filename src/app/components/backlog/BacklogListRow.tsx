'use client';

import { Calendar, Gauge, Star, Clock, Signal, Heart } from 'lucide-react';
import type { UserBacklogWithGame } from '@/types/interfaces';

interface BacklogListRowProps {
  readonly item: UserBacklogWithGame;
  readonly onStatusChange: (status: UserBacklogWithGame['status']) => void;
  readonly compact?: boolean;
}

const STATUS_LABEL: Record<UserBacklogWithGame['status'], string> = {
  to_play: 'Backlog',
  playing: 'Παίζω',
  completed: 'Ολοκληρώθηκε',
  platinumed: 'Πλατίνα',
  dropped: 'Παρατημένο',
};

export default function BacklogListRow({ item, onStatusChange, compact = false }: BacklogListRowProps) {
  const game = item.game;
  if (!game) return null;

  const containerClasses = compact
    ? 'grid grid-cols-[1fr,160px,110px,140px] items-center gap-2 rounded-lg border border-slate-800/70 bg-slate-950/70 px-3 py-2 text-xs text-slate-200'
    : 'grid grid-cols-[1fr,180px,120px,160px] items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-900/60 px-4 py-3 text-sm text-slate-200';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={`rounded-full bg-slate-800/70 px-2 ${compact ? 'py-[2px]' : 'py-0.5'} text-xs text-slate-300`}>
            {STATUS_LABEL[item.status]}
          </span>
          {item.is_favorite && (
            <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 px-2 py-0.5 text-pink-200 ring-1 ring-pink-400/40">
              <Heart className="h-3 w-3" />
              Fav
            </span>
          )}
        </div>
        <p className={compact ? 'text-sm font-semibold' : 'text-base font-semibold'}>
          {game.title}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          {game.platforms?.slice(0, 2).join(' • ')}
          {game.release_year && (
            <>
              <span className="text-slate-600">•</span>
              <span>{game.release_year}</span>
            </>
          )}
        </div>
      </div>

      <div className={`flex flex-wrap items-center gap-2 ${compact ? 'text-[11px]' : 'text-xs'}`}>
        {item.actual_hours_casual && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-1 text-blue-200 ring-1 ring-blue-500/30">
            <Clock className="h-3.5 w-3.5" />
            {item.actual_hours_casual}h
          </span>
        )}
        {item.actual_hours_platinum && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-amber-100 ring-1 ring-amber-500/30">
            <Clock className="h-3.5 w-3.5" />
            {item.actual_hours_platinum}h 🏆
          </span>
        )}
        {game.average_hours && !item.actual_hours_casual && !item.actual_hours_platinum && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-1 text-slate-200">
            <Clock className="h-3.5 w-3.5" />
            ~{Math.round(game.average_hours)}h
          </span>
        )}
      </div>

      <div className={`flex flex-wrap items-center gap-2 ${compact ? 'text-[11px]' : 'text-xs'}`}>
        {item.personal_rating && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-200 ring-1 ring-emerald-400/40">
            <Star className="h-3.5 w-3.5" />
            {item.personal_rating}/5
          </span>
        )}
        {item.personal_difficulty && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-amber-100 ring-1 ring-amber-400/40">
            <Gauge className="h-3.5 w-3.5" />
            {item.personal_difficulty}/10
          </span>
        )}
        {game.average_difficulty && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/70 px-2 py-1 text-slate-200">
            <Signal className="h-3.5 w-3.5 text-sky-300" />
            {game.average_difficulty}/10
          </span>
        )}
      </div>

      <div className={`flex flex-wrap items-center justify-end gap-2 ${compact ? 'text-[11px]' : 'text-xs'} text-slate-300`}>
        {item.added_at && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/60 px-2 py-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            {new Date(item.added_at).toLocaleDateString('el-GR')}
          </span>
        )}
        <button
          onClick={() => onStatusChange('playing')}
          className={`rounded-lg border border-slate-700 px-2 ${compact ? 'py-0.5 text-[11px]' : 'py-1 text-slate-200'} hover:border-emerald-400/60`}
        >
          Παίζω
        </button>
      </div>
    </div>
  );
}
