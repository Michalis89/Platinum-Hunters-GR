import { Trophy } from 'lucide-react';

interface TrophyStatsProps {
  readonly trophies: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  };
}

export default function TrophyStats({ trophies }: TrophyStatsProps) {
  return (
    <div className="mt-3 flex justify-center gap-6 text-xl">
      <div className="flex items-center text-gray-300">
        <Trophy className="h-6 w-6 text-blue-400" />
        <span className="ml-1 text-white">{trophies.platinum}</span>
      </div>
      <div className="flex items-center text-gray-300">
        <Trophy className="h-6 w-6 text-yellow-400" />
        <span className="ml-1 text-white">{trophies.gold}</span>
      </div>
      <div className="flex items-center text-gray-300">
        <Trophy className="h-6 w-6 text-gray-400" />
        <span className="ml-1 text-white">{trophies.silver}</span>
      </div>
      <div className="flex items-center text-gray-300">
        <Trophy className="h-6 w-6 text-orange-500" />
        <span className="ml-1 text-white">{trophies.bronze}</span>
      </div>
    </div>
  );
}
