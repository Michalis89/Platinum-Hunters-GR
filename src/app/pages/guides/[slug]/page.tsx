'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { GameDetails, Guide, ProcessedGame } from '@/types/interfaces';
import Feedback from '@/app/components/ui/Feedback';
import { Info, Trophy as TrophyIcon } from 'lucide-react';
import Skeleton from '@/app/components/ui/Skeleton';
import EditGuideButton from '@/app/components/game-details/EditGuideButton';
import UpdateGameInfoButton from '@/app/components/game-details/UpdateGameInfoButton';
import EditGameInfoModal from '@/app/components/game-details/EditGameInfoModal';
import GamePlatforms from '@/app/components/game-details/GamePlatforms';
import GameDetailsInfo from '@/app/components/game-details/GameDetailsInfo';
import GuideStats from '@/app/components/game-details/GuideStats';
import type { ReactNode } from 'react';

const TrophyStats = dynamic(() => import('@/app/components/game-details/TrophyStats'), {
  ssr: false,
});
const TrophyGuides = dynamic(() => import('@/app/components/game-details/TrophyGuides'), {
  ssr: false,
});

type TrophyListEntry = {
  name: string;
  description: string | null;
  type: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  icon_url: string | null;
};

const TROPHY_COLOR_MAP: Record<'Bronze' | 'Silver' | 'Gold' | 'Platinum', string> = {
  Bronze: 'text-orange-400',
  Silver: 'text-[var(--hb-text)]',
  Gold: 'text-yellow-300',
  Platinum: 'text-blue-300',
};

export default function GameDetailsPage() {
  const params = useParams();
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    if (params?.slug) {
      setSlug(params.slug as string);
    }
  }, [params]);

  const [game, setGame] = useState<ProcessedGame | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trophies, setTrophies] = useState<{
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  } | null>(null);
  const [trophyList, setTrophyList] = useState<TrophyListEntry[] | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchGameData = async () => {
      try {
        const delay = new Promise(res => setTimeout(res, 300));
        const gameResponse = await fetch('/api/games');
        if (!gameResponse.ok) throw new Error('Failed to fetch games');

        const gamesData: ProcessedGame[] = await gameResponse.json();

        // Match slug even if URL contains diacritics (e.g., röki -> roki)
        const normalizeSlug = (value: string | null | undefined) =>
          (value ?? '')
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replaceAll(/[\u0300-\u036f]/g, '');

        const requestedSlug = normalizeSlug(decodeURIComponent(slug));

        const matchedGame =
          gamesData.find(game => normalizeSlug(game.slug) === requestedSlug) ??
          gamesData.find(game => normalizeSlug(game.title) === requestedSlug);

        if (!matchedGame) throw new Error('Game not found');

        setGame(matchedGame);

        const [guideData, detailsData, trophiesData] = await Promise.all([
          fetch(`/api/guides/${matchedGame.id}`).then(res => res.json()),
          fetch(`/api/game-details/${matchedGame.id}`).then(res => res.json()),
          fetch(`/api/games/${matchedGame.id}/trophies`).then(async res => {
            if (!res.ok) {
              console.warn('Trophies request failed', res.status, await res.text());
              return null;
            }
            return res.json();
          }),
        ]);

        setGuides(guideData);
        setGameDetails(detailsData);
        const trophyCounts =
          trophiesData?.counts ??
          (trophiesData &&
          typeof trophiesData === 'object' &&
          'platinum' in trophiesData &&
          'gold' in trophiesData &&
          'silver' in trophiesData &&
          'bronze' in trophiesData
            ? trophiesData
            : null);
        const trophyEntries =
          trophiesData && Array.isArray((trophiesData as { trophies?: unknown[] }).trophies)
            ? (trophiesData as { trophies: TrophyListEntry[] }).trophies
            : null;

        setTrophies(trophyCounts ?? null);
        setTrophyList(trophyEntries);
        await delay;
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

  useEffect(() => {
    if (!message || !messageType) return;
    const timeout = setTimeout(
      () => {
        setMessage(null);
        setMessageType(null);
      },
      messageType === 'success' ? 3200 : 4200,
    );
    return () => clearTimeout(timeout);
  }, [message, messageType]);

  const dismissMessage = () => {
    setMessage(null);
    setMessageType(null);
  };

  if (loading) {
    return <Skeleton type="guide-detail" data-testid="skeleton" />;
  }

  if (!game) {
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

  const primaryGuide = guides[0];
  const introText = primaryGuide
    ? stripHtml(primaryGuide.content_html || primaryGuide.description || '')
    : '';
  const hasIntro = Boolean(introText);

  return (
    <div className="min-h-screen bg-[var(--hb-bg)] px-4 py-16 text-[var(--hb-text)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        {game && (
          <>
            {/* HERO SECTION */}
            <section className="flex flex-col gap-6 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-2xl shadow-black/30 backdrop-blur-md sm:flex-row sm:items-center">
              {/* Cover */}
              <div className="flex justify-center sm:block sm:w-48">
                <Image
                  src={game.cover_image ?? '/og-image.png'}
                  alt={game.title}
                  width={250}
                  height={250}
                  className="rounded-xl object-cover shadow-lg ring-2 ring-[var(--hb-border)]"
                />
              </div>

              {/* Title + Stats */}
              <div className="flex flex-1 flex-col items-center gap-4 text-center sm:items-start sm:text-left">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--hb-muted)]">
                    Platinum Hunters • Trophy Guide
                  </p>
                  <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--hb-headline)] md:text-4xl">
                    {game.title}
                  </h1>
                </div>

                {/* Difficulty / Playthroughs / Hours */}
                {guides.length > 0 &&
                  guides[0].difficulty_rating &&
                  guides[0].estimated_hours &&
                  guides[0].estimated_playthroughs && (
                    <div className="w-full">
                      <GuideStats
                        difficulty={guides[0].difficulty_rating?.toString() || 'N/A'}
                        difficultyColor={getDifficultyColor(guides[0].difficulty_rating || 0)}
                        playthroughs={guides[0].estimated_playthroughs || 0}
                        playthroughsColor={getPlaythroughsColor(
                          guides[0].estimated_playthroughs || 0,
                        )}
                        hours={guides[0].estimated_hours || 0}
                        hoursColor={getHoursColor(guides[0].estimated_hours || 0)}
                      />
                    </div>
                  )}

                {/* Quick meta row (έτος, dev, rating) */}
                {gameDetails && (
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-3 text-xs text-[var(--hb-muted)] sm:justify-start">
                    <span className="rounded-full bg-[var(--hb-card)] px-3 py-1">
                      Έτος κυκλοφορίας:{' '}
                      <span className="font-semibold text-[var(--hb-headline)]">
                        {gameDetails.release_year}
                      </span>
                    </span>
                    <span className="rounded-full bg-[var(--hb-card)] px-3 py-1">
                      Developer:{' '}
                      <span className="font-semibold text-[var(--hb-headline)]">
                        {gameDetails.developer}
                      </span>
                    </span>
                    <span className="rounded-full bg-[var(--hb-card)] px-3 py-1">
                      Βαθμολογία:{' '}
                      <span className="font-semibold text-[var(--hb-primary-strong)]">
                        {gameDetails.rating?.toFixed(2)}
                      </span>
                    </span>
                  </div>
                )}

                {/* CTA – edit guide */}
                <div className="mt-2 flex w-full justify-center sm:justify-start">
                  <EditGuideButton gameId={game.id} />
                </div>
              </div>
            </section>

            {message && messageType && (
              <div className="rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4 shadow">
                <Feedback
                  layout="inline"
                  tone={messageType === 'success' ? 'solid' : 'soft'}
                  variant={messageType}
                  title={messageType === 'success' ? 'Ενημέρωση ολοκληρώθηκε' : 'Σφάλμα ενημέρωσης'}
                  description={message}
                  dismissible
                  onDismiss={dismissMessage}
                />
              </div>
            )}

            {/* INFO + TROPHIES SECTION */}
            {(gameDetails || trophies) && (
              <section className="grid gap-6 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-xl shadow-black/30 backdrop-blur-md md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                {/* Game info */}
                {gameDetails && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-blue-400" />
                      <h2 className="text-lg font-semibold text-yellow-400">
                        Πληροφορίες Παιχνιδιού
                      </h2>
                    </div>

                    <div className="rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4 text-sm md:text-base">
                      <GameDetailsInfo {...gameDetails} />
                      <div className="mt-4 border-t border-[var(--hb-border)] pt-4">
                        <GamePlatforms platforms={gameDetails.platforms} />
                      </div>
                    </div>

                    {process.env.NODE_ENV === 'development' && (
                      <div className="flex flex-wrap items-center gap-3">
                        <UpdateGameInfoButton
                          handleUpdateInfo={handleUpdateInfo}
                          updating={updating}
                          gameDetails={gameDetails}
                        />

                        <button
                          onClick={() => setIsModalOpen(true)}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700"
                        >
                          ✏️ Επεξεργασία Πληροφοριών
                        </button>
                      </div>
                    )}

                    {message && messageType && (
                      <div className="mt-2">
                        <Feedback
                          layout="inline"
                          tone={messageType === 'success' ? 'solid' : 'soft'}
                          variant={messageType}
                          title={
                            messageType === 'success'
                              ? 'Ενημέρωση ολοκληρώθηκε'
                              : 'Σφάλμα ενημέρωσης'
                          }
                          description={message}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Trophy Stats */}
                {trophies && (
                  <div className="flex flex-col gap-4 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
                    <h3 className="text-base font-semibold text-[var(--hb-headline)]">
                      Συνολικά Trophies
                    </h3>
                    <TrophyStats trophies={trophies} />

                    {trophyList && trophyList.length > 0 && (
                      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {trophyList.map((trophy, index) => (
                          <div
                            key={`${trophy.name}-${index}`}
                            className="flex items-start gap-3 rounded-lg border border-[var(--hb-border)] bg-[var(--hb-panel)] p-3"
                          >
                            <TrophyIcon
                              className={`mt-0.5 h-5 w-5 ${TROPHY_COLOR_MAP[trophy.type]}`}
                            />
                            <div className="space-y-1">
                              <p className="font-semibold leading-tight text-white">
                                {trophy.name}
                              </p>
                              {trophy.description && (
                              <p className="text-sm text-[var(--hb-muted)]">
                                {trophy.description}
                              </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {/* GUIDES SECTION */}
        <section className="mt-4 space-y-4 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-xl shadow-black/30 backdrop-blur-md">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--hb-headline)]">Οδηγός</h2>
              <p className="text-sm text-[var(--hb-muted)]">Κύριο περιεχόμενο & βήματα</p>
            </div>
            <span className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[var(--hb-muted)]">
              Trophy Walkthrough
            </span>
          </div>

          <div className="space-y-4 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-5 shadow-inner shadow-black/20">
            {guides.length > 0 && hasIntro && (
              <div className="overflow-hidden rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4 shadow-inner shadow-black/20">
                <h3 className="text-base font-semibold text-[var(--hb-headline)]">Εισαγωγή</h3>
                <div className="prose prose-invert prose-p:my-3 max-w-none text-[var(--hb-text)]">
                  {renderGuideContent(
                    primaryGuide?.content_rich,
                    primaryGuide?.content_html,
                    primaryGuide?.description,
                  )}
                </div>
              </div>
            )}

            <TrophyGuides
              guides={guides
                .filter(g => g.steps !== undefined)
                .map(g => ({ id: g.id, steps: g.steps! }))}
            />
          </div>
        </section>

        {/* Modal */}
        {game && (
          <EditGameInfoModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            gameId={game.id}
            gameDetails={gameDetails}
            onSuccess={updatedData => {
              setGameDetails(prev => ({ ...prev, ...updatedData }));
              setMessage('Οι Πληροφορίες ενημερώθηκαν επιτυχώς!');
              setMessageType('success');
            }}
          />
        )}
      </div>
    </div>
  );
}

function renderGuideContent(
  contentRich: unknown,
  contentHtml: string | null | undefined,
  fallbackDescription: string | undefined,
): ReactNode {
  if (contentHtml) {
    return <div dangerouslySetInnerHTML={{ __html: contentHtml }} />;
  }

  if (Array.isArray((contentRich as { content?: unknown[] })?.content)) {
    const blocks = (contentRich as { content: Array<{ type?: string; text?: string }> }).content;
    if (blocks.length === 0 && fallbackDescription) {
      return <p className="whitespace-pre-wrap">{fallbackDescription}</p>;
    }
    return blocks.map((block, idx) => (
      <p key={idx} className="leading-7 text-[var(--hb-text)]">
        {block?.text ?? ''}
      </p>
    ));
  }

  if (fallbackDescription) {
    return <p className="whitespace-pre-wrap">{fallbackDescription}</p>;
  }

  return <p className="text-[var(--hb-muted)]">Δεν έχει προστεθεί περιεχόμενο ακόμη.</p>;
}

function stripHtml(html: string): string {
  return html.replaceAll(/<[^>]*>?/gm, '').trim();
}
