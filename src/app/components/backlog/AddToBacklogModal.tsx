'use client';

/**
 * Add to Backlog Modal
 * PH-31: User Backlog System
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Trophy, Clock, Signal, Check } from 'lucide-react';
import Image from 'next/image';
import EmptyState from '@/app/components/ui/EmptyState';
import type { AppDispatch } from '@/store/store';
import {
  addToBacklog,
  fetchBacklog,
  selectBacklogItems,
  selectBacklogLoading,
  selectIsInBacklog,
} from '@/store/slices/backlogSlice';
import { useGetGamesQuery } from '@/store/api/gamesApi';
import type { ProcessedGame } from '@/types/interfaces';
import { selectIsAuthenticated } from '@/store/slices/authSlice';

interface AddToBacklogModalProps {
  onClose: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 0, label: 'None', color: 'bg-slate-700 hover:bg-slate-600', icon: '⚪' },
  { value: 1, label: 'Low', color: 'bg-green-700 hover:bg-green-600', icon: '🟢' },
  { value: 2, label: 'Medium', color: 'bg-yellow-700 hover:bg-yellow-600', icon: '🟡' },
  { value: 3, label: 'High', color: 'bg-red-700 hover:bg-red-600', icon: '🔴' },
];

export default function AddToBacklogModal({ onClose }: AddToBacklogModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { data: gamesData, isLoading: gamesLoading } = useGetGamesQuery();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const backlogLoading = useSelector(selectBacklogLoading);
  const backlogItems = useSelector(selectBacklogItems);
  const hasRequestedBacklog = useRef(false);

  const [search, setSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState<ProcessedGame | null>(null);
  const [priority, setPriority] = useState(0);
  const [notes, setNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      hasRequestedBacklog.current = false;
      return;
    }
    if (backlogItems.length > 0) return;
    if (hasRequestedBacklog.current) return;
    if (backlogLoading) return;

    hasRequestedBacklog.current = true;
    dispatch(fetchBacklog({}));
  }, [dispatch, isAuthenticated, backlogItems.length, backlogLoading]);

  // Filter games based on search
  const filteredGames = useMemo(() => {
    if (!gamesData?.games) return [];
    if (!search.trim()) return gamesData.games.slice(0, 20); // Show first 20 if no search

    const searchLower = search.toLowerCase();
    return gamesData.games
      .filter(game => game.title.toLowerCase().includes(searchLower))
      .slice(0, 20);
  }, [gamesData, search]);

  const handleAdd = async () => {
    if (!selectedGame) return;

    setIsAdding(true);
    setError(null);

    try {
      await dispatch(
        addToBacklog({
          game_id: selectedGame.id,
          priority,
          notes: notes.trim() || null,
        }),
      ).unwrap();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα προσθήκης');
    } finally {
      setIsAdding(false);
    }
  };

  // Helper to check if game is already in backlog
  const GameListItem = ({ game }: { game: ProcessedGame }) => {
    const isInBacklog = useSelector(selectIsInBacklog(game.id));

    return (
      <button
        onClick={() => !isInBacklog && !backlogLoading && setSelectedGame(game)}
        disabled={isInBacklog || backlogLoading}
        className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
          backlogLoading
            ? 'cursor-wait border-slate-800 bg-slate-900/30 opacity-70'
            : isInBacklog
              ? 'cursor-not-allowed border-slate-800 bg-slate-900/30 opacity-50'
              : selectedGame?.id === game.id
                ? 'border-blue-500 bg-blue-950/50'
                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/50'
        }`}
      >
        {/* Cover */}
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
          {game.cover_image ? (
            <Image
              src={game.cover_image}
              alt={game.title}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-800">
              <Trophy className="h-6 w-6 text-slate-600" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-1 font-medium text-slate-200">{game.title}</h4>
          <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
            {game.average_hours && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {Math.round(game.average_hours)}h
              </span>
            )}
            {game.average_difficulty && (
              <span className="flex items-center gap-1">
                <Signal size={12} />
                {game.average_difficulty.toFixed(1)}/10
              </span>
            )}
            {game.trophy_total > 0 && (
              <span className="flex items-center gap-1">
                <Trophy size={12} />
                {game.trophy_total}
              </span>
            )}
          </div>
        </div>

        {/* Status */}
        {isInBacklog && (
          <div className="flex items-center gap-1 text-xs text-green-400">
            <Check size={14} />
            Στο Backlog
          </div>
        )}
        {!isInBacklog && backlogLoading && (
          <div className="text-xs text-slate-400">Έλεγχος backlog...</div>
        )}
      </button>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-0 md:items-center md:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 flex h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-800 bg-slate-900 shadow-2xl md:h-[80vh] md:max-w-4xl md:rounded-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 p-4 md:p-6">
            <h2 className="text-lg font-bold text-slate-100 md:text-xl">Προσθήκη στο Backlog</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content - Stacked on mobile, side by side on desktop */}
          <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
            {/* Left: Game List */}
            <div className={`flex flex-col border-slate-800 md:w-1/2 md:border-r ${selectedGame ? 'hidden md:flex' : 'flex-1'}`}>
              {/* Search */}
              <div className="border-b border-slate-800 p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Αναζήτηση παιχνιδιών..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    autoFocus
                  />
                </div>
              </div>

              {/* Game List */}
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {gamesLoading && (
                  <div className="text-center text-sm text-slate-400">Φόρτωση παιχνιδιών...</div>
                )}

                {!gamesLoading && filteredGames.length === 0 && (
                  <EmptyState
                    title={search ? 'Δεν βρέθηκαν παιχνίδια' : 'Δεν υπάρχουν διαθέσιμα παιχνίδια'}
                    size="sm"
                  />
                )}

                {filteredGames.map(game => (
                  <GameListItem key={game.id} game={game} />
                ))}
              </div>
            </div>

            {/* Right: Selected Game Details */}
            <div className={`flex flex-col md:w-1/2 ${selectedGame ? 'flex-1' : 'hidden md:flex'}`}>
              {selectedGame ? (
                <div className="flex flex-1 flex-col overflow-y-auto p-4 md:p-6">
                  {/* Mobile back button */}
                  <button
                    onClick={() => setSelectedGame(null)}
                    className="mb-4 flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 md:hidden"
                  >
                    ← Πίσω στη λίστα
                  </button>
                  {/* Selected Game Info */}
                  <div className="mb-6">
                    <h3 className="mb-2 text-lg font-semibold text-slate-100">
                      {selectedGame.title}
                    </h3>
                    {selectedGame.description && (
                      <p className="line-clamp-3 text-sm text-slate-400">
                        {selectedGame.description}
                      </p>
                    )}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-4 rounded-lg border border-red-800 bg-red-950 p-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  {/* Priority Selection */}
                  <div className="mb-4 md:mb-6">
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300 md:mb-3">
                      <Signal size={16} />
                      Προτεραιότητα
                    </label>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      {PRIORITY_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => setPriority(option.value)}
                          className={`flex flex-col items-center gap-2 rounded-lg p-3 text-sm font-medium text-white transition ${
                            priority === option.value
                              ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900'
                              : ''
                          } ${option.color}`}
                        >
                          <span className="text-xl">{option.icon}</span>
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-4 md:mb-6">
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Σημειώσεις
                      <span className="ml-2 text-xs text-slate-500">(προαιρετικό)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Γιατί θέλω να παίξω αυτό το παιχνίδι..."
                      rows={3}
                      maxLength={500}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-sm text-slate-200 placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <div className="mt-1 text-right text-xs text-slate-500">{notes.length}/500</div>
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={handleAdd}
                    disabled={isAdding}
                    className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
                  >
                    {isAdding ? (
                      <>Προσθήκη...</>
                    ) : (
                      <>
                        <Plus size={18} />
                        Προσθήκη στο Backlog
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                  <Search className="mb-4 h-16 w-16 text-slate-700" />
                  <h3 className="mb-2 text-lg font-semibold text-slate-300">
                    Επίλεξε ένα παιχνίδι
                  </h3>
                  <p className="text-sm text-slate-500">
                    Αναζήτησε και επίλεξε ένα παιχνίδι από την λίστα για να το προσθέσεις στο
                    backlog σου
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
