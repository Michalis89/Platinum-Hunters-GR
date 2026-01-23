import GameCard from './GameCard';
import { ProcessedGame } from '@/types/interfaces';

interface GameGridProps {
  readonly games: readonly ProcessedGame[];
}

export default function GameGrid({ games }: GameGridProps) {
  return (
    <div className="max-h-[80vh] min-h-[60vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2">
        {games.map(game => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
