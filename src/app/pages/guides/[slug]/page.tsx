'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { GameDetails } from '@/types/interfaces';
import AlertMessage from '@/app/components/ui/AlertMessage';
import { Info } from 'lucide-react';
import Skeleton from '@/app/components/ui/Skeleton';
import EditGuideButton from '@/app/components/game-details/EditGuideButton';
import UpdateGameInfoButton from '@/app/components/game-details/UpdateGameInfoButton';
import EditGameInfoModal from '@/app/components/game-details/EditGameInfoModal';
import GamePlatforms from '@/app/components/game-details/GamePlatforms';
import GameDetailsInfo from '@/app/components/game-details/GameDetailsInfo';
import GuideStats from '@/app/components/game-details/GuideStats';
import { useGame } from '@/hooks/useGame';
import { useGuides, useGameDetails, useTrophies } from '@/hooks/useGameData';

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

  // Use SWR hooks for data fetching with automatic caching
  const { game, isLoading: gameLoading, isError: gameError } = useGame(slug);
  const { guides } = useGuides(game?.id || null);
  const { gameDetails, mutate: mutateGameDetails } = useGameDetails(game?.id || null);
  const { trophies } = useTrophies(game?.id || null);

  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUpdateInfo = async () => {
    if (!game) return;

    setUpdating(true);
    setMessage('');

    try {
      const response = await fetch(`/api/update-game-info/${game.id}`, { method: 'POST' });
      const result = await response.json();

      if (response.ok) {
        setMessage('✅ Πληροφορίες ενημερώθηκαν!');
        // Revalidate the game details cache
        mutateGameDetails({ ...gameDetails, ...result.updatedData }, false);
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

  if (gameLoading) {
    return <Skeleton type="page" data-testid="skeleton" />;
  }

  if (gameError || !game) {
    return <div>❌ Game not found!</div>;
  }

  const getDifficultyColor = (rating: number): string => {
    if (rating <= 3) return 'green';
    if (rating <= 7) return 'yellow';
    return 'red';
  };

  const getPlaythroughsColor = (count: number): string => {
    if (count === 1) return 'green';
    if (count === 2) return 'yellow';
    return 'red';
  };

  const getHoursColor = (hours: number): string => {
    if (hours <= 10) return 'green';
    if (hours <= 30) return 'yellow';
    return 'red';
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-gray-900 to-gray-800 p-4 text-white md:p-8">
      {game && (
        <div className="w-full max-w-3xl rounded-lg bg-gray-900 p-4 shadow-lg md:p-6">
          <div className="mb-4 flex justify-center">
            <Image
              src={game.cover_image ?? '/og-image.png'}
              alt={game.title}
              width={200}
              height={200}
              className="rounded-lg object-contain shadow-md"
              sizes="200px"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>

          <h1 className="text-center text-2xl font-extrabold text-blue-400 md:text-3xl">
            {game.title}
          </h1>

          {guides.length > 0 &&
            guides[0].difficulty_rating &&
            guides[0].estimated_hours &&
            guides[0].estimated_playthroughs && (
              <div className="mt-4 flex flex-col justify-center gap-2 md:flex-row md:gap-4">
                <GuideStats
                  difficulty={guides[0].difficulty_rating?.toString() || 'N/A'}
                  difficultyColor={getDifficultyColor(guides[0].difficulty_rating || 0)}
                  playthroughs={guides[0].estimated_playthroughs || 0}
                  playthroughsColor={getPlaythroughsColor(guides[0].estimated_playthroughs || 0)}
                  hours={guides[0].estimated_hours || 0}
                  hoursColor={getHoursColor(guides[0].estimated_hours || 0)}
                />
              </div>
            )}

          {trophies && <TrophyStats trophies={trophies} />}

          {gameDetails && (
            <div className="mt-6 w-full max-w-2xl rounded-lg border border-gray-700 bg-gray-900 p-4 shadow-lg md:p-6">
              <h2 className="mb-4 flex items-center justify-center text-center text-base font-bold text-yellow-400 md:text-lg">
                <Info className="mr-2 h-4 w-4 text-blue-400 md:h-5 md:w-5" /> Πληροφορίες Παιχνιδιού
              </h2>
              <div className="flex flex-col gap-2 text-sm md:gap-3 md:text-base">
                <GameDetailsInfo {...gameDetails} />
              </div>
              <div className="mt-4">
                <GamePlatforms platforms={gameDetails.platforms} />
              </div>
              <div className="mt-4 flex flex-col items-center gap-3 md:flex-row md:justify-center">
                <UpdateGameInfoButton
                  handleUpdateInfo={handleUpdateInfo}
                  updating={updating}
                  gameDetails={gameDetails}
                />

                {process.env.NODE_ENV === 'development' && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full rounded-lg bg-green-600 py-2 text-white transition hover:bg-green-700 md:w-auto md:px-4"
                  >
                    ✏️ Επεξεργασία Πληροφοριών
                  </button>
                )}
              </div>
              {message && messageType && (
                <div className="mt-4">
                  <AlertMessage type={messageType} message={message} />
                </div>
              )}
            </div>
          )}

          <EditGuideButton gameId={game.id} />
        </div>
      )}

      <TrophyGuides
        guides={guides
          .filter(g => g.steps !== undefined)
          .map(g => ({ id: g.id, steps: g.steps! }))}
      />

      {game && (
        <EditGameInfoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          gameId={game.id}
          gameDetails={gameDetails}
          onSuccess={updatedData => {
            mutateGameDetails({ ...gameDetails, ...updatedData }, false);
            setMessage('✅ Πληροφορίες ενημερώθηκαν επιτυχώς!');
            setMessageType('success');
          }}
        />
      )}
    </div>
  );
}
