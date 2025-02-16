import GameCard from "./GameCard";
import { Game } from "@/types/interfaces";

interface GameGridProps {
  readonly games: readonly Game[];
}

export default function GameGrid({ games }: GameGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
