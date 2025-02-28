'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Guide, ApiGame, GameDetails } from '@/types/interfaces';
import AlertMessage from '@/app/components/ui/AlertMessage';
import { Info } from 'lucide-react';
import Skeleton from '@/app/components/ui/Skeleton';
import EditGuideButton from '@/app/components/game-details/EditGuideButton';
import UpdateGameInfoButton from '@/app/components/game-details/UpdateGameInfoButton';
import GamePlatforms from '@/app/components/game-details/GamePlatforms';
import GameDetailsInfo from '@/app/components/game-details/GameDetailsInfo';
import GuideStats from '@/app/components/game-details/GuideStats';

const TrophyStats = dynamic(() => import('@/app/components/game-details/TrophyStats'), {
  ssr: false,
});
const TrophyGuides = dynamic(() => import('@/app/components/game-details/TrophyGuides'), {
  ssr: false,
});

export default function GameDetailsPage() {
  const params = useParams();
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    if (params?.slug) {
      setSlug(params.slug as string);
    }
  }, [params]);

  const [game, setGame] = useState<ApiGame | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [trophies, setTrophies] = useState<{
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  } | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchGameData = async () => {
      try {
        const gameResponse = await fetch('/api/games');
        if (!gameResponse.ok) throw new Error('Failed to fetch games');

        const gamesData: ApiGame[] = await gameResponse.json();
        const matchedGame = gamesData.find(
          game => encodeURIComponent(game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')) === slug,
        );

        if (!matchedGame) throw new Error('Game not found');

        setGame(matchedGame);

        const [guideData, detailsData, trophiesData] = await Promise.all([
          fetch(`/api/guides/${matchedGame.id}`).then(res => res.json()),
          fetch(`/api/game-details/${matchedGame.id}`).then(res => res.json()),
          fetch(`/api/game/${matchedGame.id}`).then(res => res.json()),
        ]);

        setGuides(guideData);
        setGameDetails(detailsData);
        setTrophies(trophiesData);
      } catch (err) {
        console.error('❌ Σφάλμα στη φόρτωση:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [slug]);

  const handleUpdateInfo = async () => {
    if (!game) return;

    setUpdating(true);
    setMessage('');

    try {
      const response = await fetch(`/api/update-game-info/${game.id}`, { method: 'POST' });
      const result = await response.json();

      if (response.ok) {
        setMessage('✅ Πληροφορίες ενημερώθηκαν!');
        setGameDetails({
          ...gameDetails,
          ...result.updatedData,
        });
        setMessageType('success');
      } else {
        setMessage('❌ Σφάλμα κατά την ενημέρωση!');
        setMessageType('error');
      }
    } catch (error) {
      console.error('❌ Σφάλμα:', error);
      setMessage('❌ Αποτυχία ενημέρωσης!');
      setMessageType('error');
    }

    setUpdating(false);
  };

  if (loading || !game) {
    return <Skeleton type="page" />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white">
      {game && (
        <div className="w-full max-w-3xl rounded-lg bg-gray-900 p-6 shadow-lg">
          <div className="mb-4 flex justify-center">
            <Image
              src={game.game_image ?? '/default-image.png'}
              alt={game.title}
              width={200}
              height={200}
              className="rounded-lg object-contain shadow-md"
            />
          </div>

          <h1 className="text-center text-3xl font-extrabold text-blue-400">{game.title}</h1>

          {guides.length > 0 && (
            <GuideStats
              difficulty={guides[0].difficulty}
              difficultyColor={guides[0].difficulty_color}
              playthroughs={guides[0].playthroughs}
              playthroughsColor={guides[0].playthroughs_color}
              hours={guides[0].hours}
              hoursColor={guides[0].hours_color}
            />
          )}

          {trophies && <TrophyStats trophies={trophies} />}

          {gameDetails && (
            <div className="mt-6 rounded-lg border border-gray-700 bg-gray-900 p-6 shadow-lg">
              <h2 className="mb-4 flex items-center justify-center text-center text-lg font-bold text-yellow-400">
                <Info className="mr-2 h-5 w-5 text-blue-400" /> Game Information
              </h2>
              <GameDetailsInfo {...gameDetails} />
              <GamePlatforms platforms={gameDetails.platforms} />
              <UpdateGameInfoButton
                handleUpdateInfo={handleUpdateInfo}
                updating={updating}
                gameDetails={gameDetails}
              />
              {message && messageType && <AlertMessage type={messageType} message={message} />}
            </div>
          )}

          <EditGuideButton gameId={game.id} />
        </div>
      )}

      <TrophyGuides guides={guides} />
    </div>
  );
}
