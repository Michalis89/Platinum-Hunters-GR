'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useDispatch, useSelector } from 'react-redux';
import { Trophy, ListPlus, Check } from 'lucide-react';
import { ProcessedGame } from '@/types/interfaces';
import { addToBacklog, selectIsInBacklog } from '@/store/slices/backlogSlice';
import type { AppDispatch } from '@/store/store';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { useState } from 'react';

interface GameCardProps {
  readonly game: ProcessedGame;
}

export default function GameCard({ game }: GameCardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInBacklog = useSelector(selectIsInBacklog(game.id));
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToBacklog = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || isInBacklog || isAdding) return;

    setIsAdding(true);
    try {
      await dispatch(addToBacklog({ game_id: game.id, priority: 0 })).unwrap();
    } catch (error) {
      console.error('Error adding to backlog:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Link
      key={game.id}
      href={`/pages/guides/${game.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/70 shadow-xl shadow-blue-900/30 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-sky-400/60 hover:shadow-sky-500/30"
    >
      {/* Ambient overlay */}
      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/30 via-blue-500/20 to-emerald-400/30" />
      </div>

      {/* Add to Backlog Button */}
      {isAuthenticated && (
        <button
          onClick={handleAddToBacklog}
          disabled={isInBacklog || isAdding}
          className={`absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm transition ${
            isInBacklog
              ? 'cursor-default bg-emerald-500/90 text-slate-950'
              : 'bg-sky-500/90 text-slate-950 hover:bg-emerald-400/90'
          } disabled:opacity-50`}
          title={isInBacklog ? 'Στο Backlog' : 'Προσθήκη στο Backlog'}
        >
          {isInBacklog ? (
            <>
              <Check size={14} />
              <span className="hidden sm:inline">Στο Backlog</span>
            </>
          ) : (
            <>
              <ListPlus size={14} />
              <span className="hidden sm:inline">{isAdding ? 'Προσθήκη...' : 'Backlog'}</span>
            </>
          )}
        </button>
      )}

      {/* Media */}
      <div className="relative h-44 w-full overflow-hidden">
        <Image
          src={game.cover_image || game.background_image || '/og-image.png'}
          alt={game.title}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 300px, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
        <div className="absolute bottom-4 left-4 flex flex-col gap-1">
          <p className="text-sm text-slate-300">
            {game.platforms?.slice(0, 2).join(' • ') || 'N/A'}
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            {game.average_difficulty !== null && game.average_difficulty !== undefined && (
              <span className="rounded-full bg-slate-900/80 px-3 py-1 text-emerald-300">
                Δυσκολία: {game.average_difficulty}
              </span>
            )}
            {game.average_hours !== null && game.average_hours !== undefined && (
              <span className="rounded-full bg-slate-900/80 px-3 py-1 text-sky-300">
                Ώρες: {game.average_hours}
              </span>
            )}
            {game.release_year && (
              <span className="rounded-full bg-slate-900/80 px-3 py-1 text-slate-200">
                Έτος: {game.release_year}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h2 className="text-center text-lg font-semibold text-white transition-colors group-hover:text-emerald-300">
          {game.title}
        </h2>

        <div className="flex flex-wrap gap-2 text-xs text-slate-300">
          {game.genres?.slice(0, 3).map(genre => (
            <span
              key={genre}
              className="rounded-full border border-slate-800/60 bg-slate-950/70 px-3 py-1"
            >
              {genre}
            </span>
          ))}
          {game.genres && game.genres.length > 3 && (
            <span className="rounded-full border border-slate-800/60 bg-slate-950/70 px-2 py-1">
              +{game.genres.length - 3}
            </span>
          )}
        </div>

        <div className="flex flex-col items-center gap-3 text-sm text-slate-200">
          {/* Platinum centered */}
          <span className="flex items-center gap-2 rounded-full bg-slate-950/70 px-4 py-1.5 shadow-md">
            <Trophy className="h-4 w-4 text-blue-300" />
            {game.trophy_platinum}
          </span>

          {/* Row of 3 trophies */}
          <div className="flex items-center justify-center gap-4">
            <span className="flex items-center gap-1 rounded-full bg-slate-950/60 px-3 py-1 shadow">
              <Trophy className="h-4 w-4 text-yellow-300" />
              {game.trophy_gold}
            </span>

            <span className="flex items-center gap-1 rounded-full bg-slate-950/60 px-3 py-1 shadow">
              <Trophy className="h-4 w-4 text-slate-200" />
              {game.trophy_silver}
            </span>

            <span className="flex items-center gap-1 rounded-full bg-slate-950/60 px-3 py-1 shadow">
              <Trophy className="h-4 w-4 text-orange-300" />
              {game.trophy_bronze}
            </span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between text-sm font-semibold text-amber-300">
          <span>⭐ Σύνολο Πόντων: {game.totalPoints}</span>
          <span className="text-emerald-300 transition group-hover:text-emerald-200">
            Δες guide →
          </span>
        </div>
      </div>
    </Link>
  );
}
