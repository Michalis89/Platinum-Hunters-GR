'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ProcessedGame } from '@/types/interfaces';
import { Trophy, Clock, Signal } from 'lucide-react';

interface GameListRowProps {
  readonly game: ProcessedGame;
  readonly compact?: boolean;
}

export default function GameListRow({ game, compact = false }: GameListRowProps) {
  const containerClasses = compact
    ? 'group grid grid-cols-[72px,1fr,160px] items-center gap-3 rounded-lg border border-[var(--hb-border)] bg-[var(--hb-card)] p-2.5 text-sm shadow-sm transition hover:border-[var(--hb-primary-strong)]/60 hover:shadow-black/20'
    : 'group grid grid-cols-[96px,1fr,240px] items-center gap-4 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-3 shadow-sm transition hover:border-[var(--hb-primary-strong)]/60 hover:shadow-black/30';

  return (
    <Link
      href={`/pages/guides/${game.slug}`}
      className={containerClasses}
    >
      <div className={`relative w-full overflow-hidden rounded-lg ${compact ? 'h-16' : 'h-20'}`}>
        <Image
          src={game.cover_image || game.background_image || '/og-image.png'}
          alt={game.title}
          fill
          className="object-cover"
          sizes={compact ? '72px' : '96px'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <div className="flex flex-col gap-1">
        <p className={compact ? 'text-xs text-[var(--hb-muted)]' : 'text-sm text-[var(--hb-muted)]'}>
          {game.platforms?.slice(0, 2).join(' • ') || 'N/A'}
        </p>
        <p
          className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-[var(--hb-headline)] group-hover:text-[var(--hb-primary-strong)]`}
        >
          {game.title}
        </p>
        <div className="flex flex-wrap items-center gap-1 text-xs text-[var(--hb-muted)]">
          {game.genres?.slice(0, 2).map(genre => (
            <span
              key={genre}
              className={`rounded-full border border-[var(--hb-border)] px-2 ${compact ? 'py-[2px]' : 'py-0.5'}`}
            >
              {genre}
            </span>
          ))}
          {game.release_year && <span>• {game.release_year}</span>}
        </div>
      </div>

      <div
        className={`flex items-center justify-end ${compact ? 'gap-1.5 text-xs' : 'gap-3 text-sm'} text-[var(--hb-text)]`}
      >
        {game.average_hours !== null && game.average_hours !== undefined && (
          <span
            className={`inline-flex items-center gap-1 rounded-full bg-[var(--hb-card)] px-2 ${
              compact ? 'py-[3px]' : 'py-1'
            }`}
          >
            <Clock className="h-4 w-4 text-[var(--hb-accent)]" />
            {game.average_hours}h
          </span>
        )}
        {game.average_difficulty !== null && game.average_difficulty !== undefined && (
          <span
            className={`inline-flex items-center gap-1 rounded-full bg-[var(--hb-card)] px-2 ${
              compact ? 'py-[3px]' : 'py-1'
            }`}
          >
            <Signal className="h-4 w-4 text-[var(--hb-muted)]" />
            {game.average_difficulty}/10
          </span>
        )}
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-[var(--hb-card)] px-2 ${
            compact ? 'py-[3px]' : 'py-1'
          }`}
        >
          <Trophy className="h-4 w-4 text-[var(--hb-primary-strong)]" />
          {game.totalPoints}
        </span>
      </div>
    </Link>
  );
}
