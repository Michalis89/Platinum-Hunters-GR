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
      className="group relative flex transform flex-col items-center overflow-hidden rounded-xl border border-gray-700/50 bg-gray-900/90 p-6 shadow-xl backdrop-blur-lg transition duration-300 hover:scale-105 hover:bg-gray-800/90"
    >
      <div className="absolute inset-0 bg-blue-500 opacity-0 transition-opacity duration-500 group-hover:opacity-20"></div>

      {/* Add to Backlog Button */}
      {isAuthenticated && (
        <button
          onClick={handleAddToBacklog}
          disabled={isInBacklog || isAdding}
          className={`absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm transition ${
            isInBacklog
              ? 'bg-green-600/90 text-white cursor-default'
              : 'bg-blue-600/90 text-white hover:bg-blue-500'
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

      <div className="relative flex h-36 w-36 items-center justify-center">
        <Image
          src={game.cover_image || game.background_image || '/og-image.png'}
          alt={game.title}
          width={144}
          height={144}
          className="rounded-lg object-contain shadow-md"
          sizes="144px"
          style={{ width: 'auto', height: 'auto' }}
        />
      </div>

      <h2 className="mt-4 text-center text-xl font-bold text-white transition-colors group-hover:text-blue-400">
        {game.title}
      </h2>

      <p className="text-sm text-gray-400">{game.platforms?.join(', ') || 'N/A'}</p>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-gray-300">
        <span className="flex items-center gap-1">
          <Trophy className="h-5 w-5 text-blue-400" />
          <span className="text-blue-400">{game.trophy_platinum}</span>
        </span>
        <span className="flex items-center gap-1">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <span className="text-yellow-400">{game.trophy_gold}</span>
        </span>
        <span className="flex items-center gap-1">
          <Trophy className="h-5 w-5 text-gray-400" />
          <span className="text-gray-400">{game.trophy_silver}</span>
        </span>
        <span className="flex items-center gap-1">
          <Trophy className="h-5 w-5 text-orange-500" />
          <span className="text-orange-500">{game.trophy_bronze}</span>
        </span>
      </div>

      <p className="mt-4 flex items-center gap-2 text-lg font-semibold text-yellow-300">
        ⭐ Σύνολο Πόντων: {game.totalPoints}
      </p>
    </Link>
  );
}
