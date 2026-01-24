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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/Card';

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
    <Link key={game.id} href={`/pages/guides/${game.slug}`} className="group block h-full">
      <Card className="relative flex h-full flex-col overflow-hidden shadow-xl shadow-black/30 backdrop-blur-xl transition duration-300 group-hover:-translate-y-1 group-hover:border-[var(--hb-primary-strong)]/60 group-hover:shadow-black/40">
        {/* Ambient overlay */}
        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--hb-primary-strong)]/20 via-[var(--hb-primary)]/15 to-transparent" />
        </div>

        {/* Add to Backlog Button */}
        {isAuthenticated && (
          <button
            onClick={handleAddToBacklog}
            disabled={isInBacklog || isAdding}
            className={`absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm transition ${
              isInBacklog
                ? 'cursor-default bg-[var(--hb-primary-strong)] text-[var(--hb-bg)]'
                : 'bg-[var(--hb-primary-strong)] text-[var(--hb-bg)] hover:brightness-110'
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
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          <div className="absolute bottom-4 left-4 flex flex-col gap-1">
            <p className="text-sm text-[var(--hb-muted)]">
              {game.platforms?.slice(0, 2).join(' • ') || 'N/A'}
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              {game.average_difficulty !== null && game.average_difficulty !== undefined && (
                <span className="rounded-full bg-[var(--hb-card)] px-3 py-1 text-[var(--hb-primary-strong)]">
                  Δυσκολία: {game.average_difficulty}
                </span>
              )}
              {game.average_hours !== null && game.average_hours !== undefined && (
                <span className="rounded-full bg-[var(--hb-card)] px-3 py-1 text-[var(--hb-accent)]">
                  Ώρες: {game.average_hours}
                </span>
              )}
              {game.release_year && (
                <span className="rounded-full bg-[var(--hb-card)] px-3 py-1 text-[var(--hb-text)]">
                  Έτος: {game.release_year}
                </span>
              )}
            </div>
          </div>
        </div>

        <CardHeader className="border-b-0 px-5 pb-0 pt-5">
          <CardTitle className="text-center transition-colors group-hover:text-[var(--hb-primary-strong)]">
            {game.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-3 px-5 pt-3">
          <div className="flex flex-wrap gap-2 text-xs text-[var(--hb-muted)]">
            {game.genres?.slice(0, 3).map(genre => (
              <span
                key={genre}
                className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 py-1"
              >
                {genre}
              </span>
            ))}
            {game.genres && game.genres.length > 3 && (
              <span className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-2 py-1">
                +{game.genres.length - 3}
              </span>
            )}
          </div>

          <div className="flex flex-col items-center gap-3 text-sm text-[var(--hb-text)]">
            <span className="flex items-center gap-2 rounded-full bg-[var(--hb-card)] px-4 py-1.5 shadow-md">
              <Trophy className="h-4 w-4 text-[var(--hb-primary-strong)]" />
              {game.trophy_platinum}
            </span>

            <div className="flex items-center justify-center gap-4">
              <span className="flex items-center gap-1 rounded-full bg-[var(--hb-card)] px-3 py-1 shadow">
                <Trophy className="h-4 w-4 text-[var(--hb-accent)]" />
                {game.trophy_gold}
              </span>

              <span className="flex items-center gap-1 rounded-full bg-[var(--hb-card)] px-3 py-1 shadow">
                <Trophy className="h-4 w-4 text-[var(--hb-text)]" />
                {game.trophy_silver}
              </span>

              <span className="flex items-center gap-1 rounded-full bg-[var(--hb-card)] px-3 py-1 shadow">
                <Trophy className="h-4 w-4 text-[var(--hb-muted)]" />
                {game.trophy_bronze}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t-0 px-5 pb-5 pt-0">
          <div className="flex w-full items-center justify-between text-sm font-semibold text-[var(--hb-primary-strong)]">
            <span>⭐ Σύνολο Πόντων: {game.totalPoints}</span>
            <span className="text-[var(--hb-muted)] transition group-hover:text-[var(--hb-primary-strong)]">
              Δες guide →
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
