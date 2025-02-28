import { Calendar, Building2, BookOpen, Joystick, Trophy, Star, ShieldAlert } from 'lucide-react';

interface GameDetailsInfoProps {
  readonly release_year?: number | null;
  readonly developer?: string | null;
  readonly publisher?: string | null;
  readonly genre?: string | null;
  readonly rating?: number | null;
  readonly metacritic?: number | null;
  readonly esrb_rating?: string | null;
}

export default function GameDetailsInfo({
  release_year,
  developer,
  publisher,
  genre,
  rating,
  metacritic,
  esrb_rating,
}: GameDetailsInfoProps) {
  return (
    <div className="grid grid-cols-1 gap-4 text-gray-300 md:grid-cols-2">
      <div className="flex flex-col space-y-2">
        {typeof release_year === 'number' && (
          <p className="flex items-center">
            <Calendar className="mr-2 h-4 w-4 text-red-400" />
            <span className="font-semibold">Release Year:</span>
            <span className="ml-2 text-white">{release_year}</span>
          </p>
        )}
        {developer && (
          <p className="flex items-center">
            <Building2 className="mr-2 h-4 w-4 text-blue-400" />
            <span className="font-semibold">Developer:</span>
            <span className="ml-2 text-white">{developer}</span>
          </p>
        )}
        {publisher && (
          <p className="flex items-center">
            <BookOpen className="mr-2 h-4 w-4 text-purple-400" />
            <span className="font-semibold">Publisher:</span>
            <span className="ml-2 text-white">{publisher}</span>
          </p>
        )}
        {genre && (
          <p className="flex items-center">
            <Joystick className="mr-2 h-4 w-4 text-yellow-400" />
            <span className="font-semibold">Genre:</span>
            <span className="ml-2 text-white">{genre}</span>
          </p>
        )}
      </div>

      <div className="flex flex-col space-y-2">
        {typeof rating === 'number' && (
          <p className="flex items-center">
            <Trophy className="mr-2 h-4 w-4 text-green-400" />
            <span className="font-semibold">Rating:</span>
            <span className="ml-2 text-white">{rating}</span>
          </p>
        )}
        {typeof metacritic === 'number' && (
          <p className="flex items-center">
            <Star className="mr-2 h-4 w-4 text-yellow-500" />
            <span className="font-semibold">Metacritic:</span>
            <span className="ml-2 text-white">{metacritic}</span>
          </p>
        )}
        {esrb_rating && (
          <p className="flex items-center">
            <ShieldAlert className="mr-2 h-4 w-4 text-red-500" />
            <span className="font-semibold">ESRB Rating:</span>
            <span className="ml-2 text-white">{esrb_rating}</span>
          </p>
        )}
      </div>
    </div>
  );
}
