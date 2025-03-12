import Link from 'next/link';
import Image from 'next/image';
import { Game } from '@/types/interfaces';

interface GameCardProps {
  readonly game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const gameSlug = encodeURIComponent(game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

  return (
    <Link
      key={game.id}
      href={`/pages/guide/${gameSlug}`}
      className="group relative flex transform flex-col items-center overflow-hidden rounded-xl border border-gray-700/50 bg-gray-900/90 p-6 shadow-xl backdrop-blur-lg transition duration-300 hover:scale-105 hover:bg-gray-800/90"
    >
      <div className="absolute inset-0 bg-blue-500 opacity-0 transition-opacity duration-500 group-hover:opacity-20"></div>

      <div className="relative flex h-36 w-36 items-center justify-center">
        <Image
          src={game.game_image}
          alt={game.title}
          width={144}
          height={144}
          className="rounded-lg object-contain shadow-md"
        />
      </div>

      <h2 className="mt-4 text-center text-xl font-bold text-white transition-colors group-hover:text-blue-400">
        {game.title}
      </h2>

      <p className="text-sm text-gray-400">{game.platform}</p>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-gray-300">
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

      <p className="mt-4 flex items-center gap-2 text-lg font-semibold text-yellow-300">
        ⭐ Σύνολο Πόντων: {game.totalPoints}
      </p>
    </Link>
  );
}
