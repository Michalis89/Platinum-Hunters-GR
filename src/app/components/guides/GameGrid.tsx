import GameCard from './GameCard';
import { ProcessedGame } from '@/types/interfaces';

interface GameGridProps {
  readonly games: readonly ProcessedGame[];
}

export default function GameGrid({ games }: GameGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
      {games.map(game => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
