import Image from "next/image";
import { Game } from "@/types/interfaces";

interface GameCardProps {
  readonly game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <a
      key={game.id}
      href={`/pages/guide/${encodeURIComponent(game.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}`}
      className="relative p-6 bg-gray-900/90 backdrop-blur-lg rounded-xl shadow-xl transform transition duration-300 hover:scale-105 hover:bg-gray-800/90 flex flex-col items-center border border-gray-700/50 group overflow-hidden"
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>

      {/* Game Image */}
      <div className="relative w-36 h-36 flex justify-center items-center">
        <Image
          src={game.game_image}
          alt={game.title}
          width={144}
          height={144}
          className="rounded-lg shadow-md object-contain"
        />
      </div>

      {/* Game Title */}
      <h2 className="text-xl font-bold text-white text-center mt-4 group-hover:text-blue-400 transition-colors">
        {game.title}
      </h2>

      {/* Platform */}
      <p className="text-sm text-gray-400">{game.platform}</p>

      {/* Trophy Counts */}
      <div className="flex flex-wrap justify-center items-center gap-2 mt-3 text-sm text-gray-300">
        <span className="flex items-center gap-1">
          🏆 <span className="text-yellow-400">{game.trophies.Platinum}</span>
        </span>
        <span className="flex items-center gap-1">
          🥇 <span className="text-orange-400">{game.trophies.Gold}</span>
        </span>
        <span className="flex items-center gap-1">
          🥈 <span className="text-blue-300">{game.trophies.Silver}</span>
        </span>
        <span className="flex items-center gap-1">
          🥉 <span className="text-green-400">{game.trophies.Bronze}</span>
        </span>
      </div>

      {/* Total Points */}
      <p className="mt-4 text-yellow-300 font-semibold text-lg flex items-center gap-2">
        ⭐ Σύνολο Πόντων: {game.totalPoints}
      </p>
    </a>
  );
}
